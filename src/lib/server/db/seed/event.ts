import { faker } from '@faker-js/faker';
import { generateUniqueNanoids } from '$lib/server/db/seed/utils';
import { slugify } from '$lib/utils/slug';
import { generateRandomDatePairs, selectOneOfArray } from '$lib/server/db/seed/utils';
import { countryCodes } from '$lib/utils/country';
import { event as eventTable, actionCode as actionCodeTable } from '$lib/schema/drizzle';
import { v7 as uuidv7 } from 'uuid';
export function generateEvents(
	count: number = 50,
	options: { organizationId: string; teamId?: string; pointPersonId?: string }
): {
	events: (typeof eventTable.$inferInsert)[];
	actionCodes: (typeof actionCodeTable.$inferInsert)[];
} {
	const [startDates, endDates] = generateRandomDatePairs(count);
	const ids = new Array(count).fill(0).map(() => uuidv7());
	const eventSignupActionCodeIds = generateUniqueNanoids(count);
	const eventAttendedActionCodeIds = generateUniqueNanoids(count);
	const events: (typeof eventTable.$inferInsert)[] = [];
	const usedNames = new Set<string>();
	const usedSlugs = new Set<string>();
	for (let i = 0; i < count; i++) {
		let eventName: string;
		let slug: string;
		let isOnline = faker.datatype.boolean(0.5);

		// Generate unique name and slug
		let attempts = 0;
		do {
			eventName = selectOneOfArray(eventNames);
			slug = slugify(eventName);
			attempts++;

			// If we've tried too many times with the same name, add a suffix
			if (attempts > 5) {
				eventName = `${eventName} ${faker.number.int({ min: 1, max: 999 })}`;
				slug = slugify(eventName);
			}
		} while (usedNames.has(eventName) || usedSlugs.has(slug));

		// Add to used sets
		usedNames.add(eventName);
		usedSlugs.add(slug);

		const event: typeof eventTable.$inferInsert = {
			id: ids[i],
			title: eventName,
			slug: slug,
			description: null,
			shortDescription: faker.lorem.paragraph(),
			startsAt: startDates[i],
			endsAt: endDates[i],
			published: faker.datatype.boolean(),
			onlineLink: isOnline ? faker.internet.url() : null,
			country: selectOneOfArray([...countryCodes]),
			addressLine1: isOnline ? null : faker.location.streetAddress(),
			addressLine2: isOnline ? null : faker.location.secondaryAddress(),
			locality: isOnline ? null : faker.location.city(),
			region: isOnline ? null : faker.location.state(),
			postcode: isOnline ? null : faker.location.zipCode(),
			maxSignups: Math.random() > 0.9 ? faker.number.int({ min: 1, max: 100 }) : 0,
			sendReminderHoursBefore: 24,
			settings: {
				displayTimezone: false,
				signupFields: { standard: [], custom: [] }
			},
			signupTag: null,
			attendanceTag: null,
			timezone: faker.location.timeZone(),
			featureImage: faker.image.urlPicsumPhotos({
				width: 900,
				height: 600
			}),
			organizationId: options.organizationId,
			teamId: Math.random() > 0.5 ? options.teamId : undefined,
			createdAt: faker.date.recent({ days: 30 }),
			updatedAt: faker.date.recent({ days: 20 })
		};
		events.push(event);
	}
	const actionCodes: (typeof actionCodeTable.$inferInsert)[] = [];
	for (let i = 0; i < events.length; i++) {
		const event = events[i];
		actionCodes.push({
			id: eventSignupActionCodeIds[i],
			organizationId: options.organizationId,
			referenceId: event.id,
			type: 'event_signup',
			createdAt: event.createdAt
		});
		actionCodes.push({
			id: eventAttendedActionCodeIds[i],
			organizationId: options.organizationId,
			referenceId: event.id,
			type: 'event_attended',
			createdAt: event.createdAt
		});
	}
	return { events, actionCodes };
}

export const eventNames = [
	'Voices for Change: Community Forum',
	'Youth Climate Action Workshop',
	'Building Power: Organizer Skillshare',
	'Healing Justice Circle',
	'Green Futures: Sustainability Fair',
	'Decolonizing Education: Panel Discussion',
	'Mutual Aid 101',
	'People Over Profit: Teach-In',
	'Solidarity Not Charity: Volunteer Night',
	'Campaign Launch: Housing for All',
	'Art & Activism Showcase',
	'Know Your Rights Training',
	'From Protest to Policy: Strategy Session',
	'Climate & Colonialism: Fireside Chat',
	'Safe Streets, Safe Communities Rally',
	'Local Leaders, Global Impact Summit',
	'Reimagining Justice: Community Assembly',
	'Building Resilient Neighborhoods',
	'Our Voices, Our Schools Town Hall',
	'Unhoused Not Unseen: Awareness Walk',
	'Organize the Future: Youth Summit',
	"Workers' Rights Now!",
	'Transforming Systems: Policy Hackathon',
	'Education for Liberation Workshop',
	'Freedom to Thrive Forum',
	'EcoJustice Now! Day of Action',
	'Storytelling for Social Change',
	'Food is a Right: Community Potluck',
	'Indigenous Sovereignty Teach-In',
	'Reclaim the Block: Strategy Meeting',
	'Healthcare is a Human Right Rally',
	'Power in Numbers: Organizer Meetup',
	'Justice Through Art Exhibit',
	'Beyond the Binary: Gender Justice Talk',
	'Restorative Practices in Schools Workshop',
	'Activism Through Music: Benefit Concert',
	"The People's Budget: Town Hall",
	'Youth Organizers Unite',
	'Voices from the Margins: Film Night',
	'Reproductive Rights Now! March',
	'Movement Building 101',
	'From Harm to Healing: Justice Panel',
	'Freedom Songs: Community Singalong',
	'Green Tech for Good Hackathon',
	'Digital Organizing Toolkit Training',
	'Activist Self-Care Circle',
	'Disability Justice Now!',
	'The Right to the City: Urban Justice Walk',
	'Seeds of Resistance: Gardening Day',
	'Climate Grief, Climate Hope: Dialogue',
	'Unpacking Privilege Workshop',
	'Community Safety Without Police Forum',
	'Borderless Solidarity: Immigrant Justice Rally',
	'Mutual Aid Mapping Project Launch',
	'Black Futures Now: Youth Forum',
	'Climate + Capitalism Panel',
	'Voices of the Elders: Oral Histories Event',
	'Justice Through Poetry Night',
	'Housing is Dignity: Community Speak-Out',
	'Power Mapping for Change Workshop',
	'Consent & Culture: Campus Conversation',
	'Radical Hospitality: Shelter Volunteer Day',
	"People's Assembly on Climate Justice",
	'Freedom School: Abolitionist Education Series',
	'From the Ground Up: Land Justice Gathering',
	'Health Equity Roundtable',
	'Organizing for Clean Air & Water',
	'Farmworkers Speak: Labor Justice Talk',
	'Queer Liberation Now! Rally',
	'Rooted Resistance: Community Garden Day',
	'Anti-Racism in Action: Training',
	'Campaign Strategy Deep Dive',
	'Defund to Rebuild: Policy Forum',
	'Healing in Community: Story Circle',
	'Solidarity Economy 101',
	'Voices of Youth: Climate Town Hall',
	'Street Medics Skillshare',
	'Indigenous Land Back Teach-In',
	'Reclaim Our Time: Black History Celebration',
	'Freedom Dreaming Workshop',
	'Local Organizers Mixer',
	'Accessibility for All: Forum',
	'Rest as Resistance: Community Nap Day',
	'Abolition & Education Roundtable',
	'Justice is Intersectional: Conference',
	'Peace & Power: Conflict Resolution Workshop',
	'The Future is Cooperative: Worker Co-ops Panel',
	'Holding Space: Grief and Justice Circle',
	'Beyond Reform: Police Abolition Teach-In',
	'Community Care is Radical',
	'Organizing with Joy Workshop',
	'Resisting Displacement: Housing Panel',
	'Ending Hunger Together: Meal Pack Day',
	'Water is Life: Solidarity March',
	'Changemakers in Conversation',
	'Food Forest Planting Day',
	'Creative Organizing Tactics Workshop',
	'Protect the Sacred: Indigenous Rights Event',
	'Care Not Cops: Community Forum',
	'Education Justice for All',
	'Youth Voices on Climate',
	'Liberation Through Literacy',
	'Sanctuary Cities Now! Panel',
	'Reparations Now: Justice Dialogue'
];
