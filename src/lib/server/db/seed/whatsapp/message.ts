import { v4 as uuidv4, v7 as uuidv7 } from 'uuid';
import { faker } from '@faker-js/faker';

import { selectOneOfArray } from '$lib/server/db/seed/utils';
import {
	whatsappMessage as whatsappMessageTable,
	activity as activityTable
} from '$lib/schema/drizzle';

type MessageDirection = 'incoming' | 'outgoing';

export interface WhatsappMessageGeneratorOptions {
	organizationId: string;
	peopleIds: string[];
	accountIds: string[];
	userIds: string[];
	count: number;
	/**
	 * Minimum number of people guaranteed to have more than one conversation
	 * burst spread across at least two different accounts (added on top of
	 * `count`, so total messages will exceed `count`).
	 */
	minMultiAccountPeople?: number;
}

export interface GeneratedWhatsappMessages {
	messages: (typeof whatsappMessageTable.$inferInsert)[];
	activities: (typeof activityTable.$inferInsert)[];
	/** personIds that received at least one incoming message, for the customer-service window */
	incomingRecipientIds: Set<string>;
}

/**
 * Generates individual (non-thread) WhatsApp messages plus their matching
 * activity records.
 *
 * Messages are produced in short *conversation bursts*: each burst is a single
 * (person, account) pair with timestamps advancing over a few minutes and the
 * direction alternating, so an incoming question and its outgoing reply share
 * the same `whatsappAccountId` and read as a coherent back-and-forth.
 *
 * After the main volume is generated, a guarantee phase gives at least
 * `minMultiAccountPeople` people two bursts on two different accounts, so the
 * cross-account activity tabs (see `zero/query/activity/list.ts`) always have
 * real multi-account conversations to show.
 *
 * Every message is deliberately created *without* a `whatsappThreadId` (null) so
 * it represents an ad-hoc individual conversation rather than a broadcast
 * thread.
 *
 * For every `whatsapp_message` row we emit a paired `activity` row whose
 * `referenceId` equals the message id — this is the polymorphic link the app
 * relies on (`activity.type` `whatsapp_message_incoming` / `_outgoing`).
 */
export function generateWhatsappMessagesWithActivities(
	options: WhatsappMessageGeneratorOptions
): GeneratedWhatsappMessages {
	const {
		organizationId,
		peopleIds,
		accountIds,
		userIds,
		count,
		minMultiAccountPeople = 10
	} = options;

	const messages: (typeof whatsappMessageTable.$inferInsert)[] = [];
	const activities: (typeof activityTable.$inferInsert)[] = [];
	const incomingRecipientIds = new Set<string>();

	if (peopleIds.length === 0 || accountIds.length === 0) {
		return { messages, activities, incomingRecipientIds };
	}

	// Emits one conversation burst; `maxSize` caps its length (1-6, further capped
	// by maxSize so the main phase never overshoots `count`).
	function pushBurst(personId: string, whatsappAccountId: string, maxSize: number) {
		const burstSize = Math.min(maxSize, 1 + Math.floor(Math.random() * 6)); // 1-6
		let direction: MessageDirection = Math.random() > 0.5 ? 'incoming' : 'outgoing';
		let timestamp = faker.date.recent({ days: 30 });

		for (let i = 0; i < burstSize; i++) {
			const messageId = uuidv7();
			const createdAt = timestamp;

			messages.push(
				buildWhatsappMessage({
					direction,
					messageId,
					personId,
					whatsappAccountId,
					organizationId,
					userIds,
					createdAt
				})
			);

			if (direction === 'incoming') {
				incomingRecipientIds.add(personId);
			}

			activities.push({
				id: uuidv7(),
				organizationId,
				personId,
				userId: null,
				type: direction === 'incoming' ? 'whatsapp_message_incoming' : 'whatsapp_message_outgoing',
				referenceId: messageId,
				// incoming messages are more likely to be unread
				unread: direction === 'incoming' ? Math.random() > 0.4 : false,
				createdAt
			});

			// advance the conversation: next reply a few minutes later, alternating side
			direction = direction === 'incoming' ? 'outgoing' : 'incoming';
			timestamp = new Date(timestamp.getTime() + (1 + Math.floor(Math.random() * 5)) * 60_000);
		}
	}

	// main volume: random person + random account per burst
	while (messages.length < count) {
		pushBurst(selectOneOfArray(peopleIds), selectOneOfArray(accountIds), count - messages.length);
	}

	// guarantee: at least `minMultiAccountPeople` people have two bursts on two
	// distinct accounts (needs at least two accounts to be possible)
	if (accountIds.length >= 2 && minMultiAccountPeople > 0) {
		const targetCount = Math.min(minMultiAccountPeople, peopleIds.length);
		const chosenPeople = shuffle(peopleIds).slice(0, targetCount);
		for (const personId of chosenPeople) {
			const [accountA, accountB] = pickTwoDistinct(accountIds);
			pushBurst(personId, accountA, 6);
			pushBurst(personId, accountB, 6);
		}
	}

	return { messages, activities, incomingRecipientIds };
}

function shuffle<T>(array: T[]): T[] {
	const copy = [...array];
	for (let i = copy.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[copy[i], copy[j]] = [copy[j], copy[i]];
	}
	return copy;
}

// caller guarantees `accountIds.length >= 2`
function pickTwoDistinct(accountIds: string[]): [string, string] {
	const first = Math.floor(Math.random() * accountIds.length);
	let second = Math.floor(Math.random() * (accountIds.length - 1));
	if (second >= first) second += 1;
	return [accountIds[first], accountIds[second]];
}

function buildWhatsappMessage({
	direction,
	messageId,
	personId,
	whatsappAccountId,
	organizationId,
	userIds,
	createdAt
}: {
	direction: MessageDirection;
	messageId: string;
	personId: string;
	whatsappAccountId: string;
	organizationId: string;
	userIds: string[];
	createdAt: Date;
}): typeof whatsappMessageTable.$inferInsert {
	const wamidId = uuidv4();
	const text = selectOneOfArray(direction === 'incoming' ? incomingMessages : outgoingMessages);
	const image_url =
		Math.random() > 0.8 ? faker.image.urlPicsumPhotos({ width: 400, height: 250 }) : undefined;

	const status =
		direction === 'incoming'
			? 'delivered'
			: selectOneOfArray(['sent', 'delivered', 'read'] as const);

	const deliveredAt =
		direction === 'outgoing' && status !== 'sent' ? new Date(createdAt.getTime() + 2000) : null;
	const readAt =
		direction === 'incoming' || status === 'read' ? new Date(createdAt.getTime() + 5000) : null;

	return {
		id: messageId,
		organizationId,
		whatsappThreadId: null,
		whatsappAccountId,
		externalId: uuidv4(),
		wamidId,
		type: direction === 'incoming' ? 'incoming_api_message' : 'outgoing_api_message',
		message: {
			id: direction === 'incoming' ? wamidId : messageId,
			text,
			image_url,
			wamid: wamidId,
			emojiReactions: []
		},
		// incoming messages have no sending user; outgoing usually attributed to a user
		userId:
			direction === 'outgoing' && userIds.length > 0 && Math.random() > 0.3
				? selectOneOfArray(userIds)
				: null,
		personId,
		status,
		statusMessage: null,
		deliveredAt,
		readAt,
		createdAt,
		updatedAt: createdAt
	};
}

const outgoingMessages = [
	'Hi! Yes, the event is still on. Starts at 10AM at the community hall.',
	'Absolutely, friends are welcome!',
	'We’ll host another rally next month—stay tuned!',
	'The venue is 14 Riverside Ave, near the park entrance.',
	'Yes! We’re always grateful for volunteers.',
	'Thanks for the kind words 😊',
	'You’re now signed up for our newsletter!',
	'You can donate at communitygroup.org/donate',
	'You can apply for the mentorship program online!',
	'Yes—childcare will be provided from 9:30AM.',
	'Masks are encouraged but not required.',
	'Here’s the Zoom link again: [zoom.us/xyz]',
	"Yes, you're welcome even if you're outside the district!",
	'Interpretation in Spanish and Vietnamese will be available.',
	'We appreciate your support so much ❤️',
	'Yes, you can still RSVP via this link: [rsvp.link]',
	'We’ll send out the recording afterward!',
	'Just bring yourself and maybe a dish to share.',
	'Here’s the flyer again: [PDF]',
	'There’s a parking lot next to the venue.',
	'Yes! We’re offering digital volunteer roles this month.',
	'Totally fine to bring your kids!',
	"Here's the application form: [form link]",
	'The training is free of charge.',
	'Yes, please share it widely!',
	'The building has wheelchair access and an elevator.',
	'Yes, please arrive 30 min early to help set up.',
	'Comfortable clothes and walking shoes recommended.',
	'We welcome any canned goods or shelf-stable items.',
	'Volunteers usually arrive 15 minutes early.',
	'Yes, there will be an ASL interpreter present.',
	'You don’t need to be a member to attend.',
	'We have a teen action night coming up soon!',
	'Yes, it’s designed for first-timers.',
	'We’d love for you to help facilitate!',
	'Plan for around 90 minutes total.',
	'Snacks and drinks will be provided.',
	'Yes, you can pay at the door.',
	'Welcome! Let’s get you involved 💪',
	'Please leave pets at home unless they’re service animals.',
	'We’ll notify everyone if it rains!',
	'You’re welcome to join late—just check in at the table.',
	'Remote help is much appreciated! We’ll send links.',
	'Agenda is posted here: [Google Doc]',
	'We’ve removed your number from alerts.',
	'Here’s a list of upcoming events by area: [link]',
	'Yes, we’ve added you to the waitlist.',
	"You can still participate! We'll catch you up.",
	'We offer ride shares—just request one here.',
	'Casual and comfortable is perfect.',
	'Yes! It’s family-friendly.',
	'Please email outreach@org.org to request a speaker.',
	'Yes, there will be a Q&A at the end.',
	'We follow local health guidelines and mask up indoors.',
	'Our team meets biweekly on Thursdays.',
	'Office hours are 10–3 on weekdays.',
	'Definitely—no experience necessary.',
	'Yes, the fridge is restocked weekly.',
	'Feel free to borrow what you need.',
	'We’ll bring copies to the venue for anyone who needs them.',
	'We do offer reimbursements—ask for a form at check-in.',
	'Yes, this number is monitored for support requests.',
	'We’ll email your tax receipt shortly.',
	'You can talk to Maya, our youth coordinator.',
	'Listening is just as important—see you there!',
	'You can send payments via @CommunityOrg on Venmo.',
	'We’ll add you to the WhatsApp group!',
	'We’ll have vegetarian, vegan, and gluten-free options.',
	'Here’s the closest bus stop: [map]',
	'Our emergency contact is listed on the info sheet.',
	'We’ll post photos on Instagram @ourcommunitygroup.',
	'Rescheduling is no problem—just let us know.',
	'Absolutely! Bring a few copies to share.',
	'Yes! T-shirts and totes will be available at the table.',
	'Here’s the livestream link: [YouTube]',
	'Yes, we accept donated items—thank you!',
	"You're welcome to drop in even if you can't stay long.",
	'There are restrooms behind the main hall.',
	'Please bring ID if you’re picking up supplies.',
	'You can contact Alex about the open mic slots.',
	'Masks are optional but recommended indoors.',
	'We’d love help putting up posters in your area!',
	'Yes, we offer attendance certificates on request.',
	'Breakout rooms will be listed in the chat.',
	'Setup usually takes about 45 minutes.',
	'There’s bike parking next to the garden.',
	'We’d love to feature your podcast—let’s chat!',
	'Pets are okay at outdoor events only.',
	'Please register by Friday evening.',
	'No waiver required—just show up!',
	'The training covers organizing, outreach, and care.',
	'You can apply here: [housing link]',
	'Yes, shadowing is encouraged for new volunteers.',
	'We do! Next ASL class starts in July.',
	'Nomination forms are open now on our site.',
	'Yes, we’ll send a full recap afterward.',
	'Call us at (123) 456-7890 anytime.',
	'We offer verified hours—ask at check-out.',
	'Your badge will be ready at the check-in desk.',
	'Meals will be labeled for dietary needs.',
	'You can become a member anytime—link’s on the site.',
	'All our events aim to be inclusive for kids and families.',
	'Yes, we’ve partnered with three local schools this term.',
	'Done! You’re on our email list now.'
];

const incomingMessages = [
	'Hey, is the community event still on for Saturday?',
	'Can I bring a friend to the training?',
	'Sorry I missed the rally today. Will there be another one soon?',
	"Where exactly is the venue for tomorrow's session?",
	'Do you need volunteers for the food drive?',
	'Thanks for organizing today’s workshop. Super helpful.',
	'I’d like to sign up for the newsletter.',
	'Is there a way I can donate directly to the housing project?',
	'I heard about the youth mentorship program—how do I join?',
	'Is childcare provided at the weekend event?',
	'How can I get involved in the local clean-up drive?',
	'Are masks required at the town hall meeting?',
	'I lost the Zoom link for tonight’s session. Can you resend?',
	'Can I attend if I live outside the district?',
	'Do you offer interpretation during your events?',
	'Just wanted to say thank you for all that you do ❤️',
	'Can I still RSVP for Sunday’s event?',
	'Will the session be recorded?',
	'Do I need to bring anything to the potluck?',
	'Can you send me the flyer again?',
	'Is parking available near the venue?',
	'Do you offer online volunteer opportunities?',
	'Can I bring my kid to the rally?',
	'How do I apply for the community grant?',
	'Is there a fee to attend the training?',
	'Can I share your event in my neighborhood group?',
	'Is the event wheelchair accessible?',
	'Do you need help setting up chairs?',
	'What should I wear for the march?',
	'Do you accept food donations?',
	'What time should I arrive to help out?',
	'Will there be sign language interpretation?',
	'Can I join even if I’m not a member yet?',
	'Do you have events for teens?',
	'Is the workshop beginner-friendly?',
	'I’m interested in leading a breakout group.',
	'How long is the session?',
	'Is dinner provided?',
	'Can I pay cash at the door?',
	'I just moved here—how do I get plugged in?',
	'Are pets allowed at the outdoor event?',
	'Will the event be rescheduled if it rains?',
	'I’m running late—can I still join?',
	'Can I volunteer remotely?',
	'Do you have an agenda for tomorrow?',
	'How do I unsubscribe from alerts?',
	'Are there any upcoming events in the suburbs?',
	'Is there a waitlist for the next cohort?',
	'I missed the orientation—can I still participate?',
	'Do you provide transportation assistance?',
	'What’s the dress code?',
	'Is the film appropriate for kids?',
	'How can I request a speaker for our school?',
	'Will there be a Q&A?',
	'I’m immunocompromised—what precautions are in place?',
	'How often do the meetings happen?',
	'Do you have office hours?',
	'Can I join the art build even if I’m not crafty?',
	'Is the community fridge still operating?',
	'Can I borrow chairs from the group?',
	'I don’t have a printer—can you bring copies?',
	'Do you reimburse for gas?',
	'Is this the right number to text for help?',
	'Do you have a donation receipt for tax purposes?',
	'Is there a youth coordinator I can talk to?',
	'Can I come just to listen?',
	'What’s your Venmo handle?',
	'Is there a WhatsApp group for volunteers?',
	'Are meals vegetarian?',
	'How do I get to the site via public transport?',
	'Who should I contact in case of emergency?',
	'Will you be posting photos after?',
	'How do I reschedule my shift?',
	'Can I bring flyers for my own cause?',
	'Do you have merch I can buy?',
	'Is there a livestream link?',
	'Can I donate supplies?',
	'What if I can’t stay for the full event?',
	'Are there bathrooms onsite?',
	'Do I need to bring ID?',
	'I’d like to perform music—who do I ask?',
	'What’s the COVID policy?',
	'Do you need help distributing posters?',
	'Can I get a certificate for attending?',
	'Will there be breakout rooms?',
	'How long is setup?',
	'Can I park my bike there?',
	'Can I record the speaker for my podcast?',
	'Are dogs allowed?',
	'Is there a registration deadline?',
	'Do I need to sign a waiver?',
	'What does the training cover?',
	'How do I apply for housing support?',
	'Can I shadow someone during the event?',
	'Do you offer ASL classes?',
	'How do I nominate someone for the award?',
	'Can I get a recap if I miss a session?',
	'Is there a phone number I can call?',
	'Do you give community service hours?',
	'Where do I pick up my badge?',
	'Is food halal/kosher?',
	'How do I become a member?',
	'Are your events kid-friendly?',
	'Do you partner with schools?',
	'Can you add me to your email list?'
];
