import { eventRegistration } from '$lib/server/utils/email/context/transactional/event_reminder_registration';
import { drizzle } from '$lib/server/db';
import { eventSignup, organization, event, person, activity } from '$lib/schema/drizzle';
import { eq } from 'drizzle-orm';
import { type Locale } from '$lib/utils/language';
import sendTemplateEmail from '$lib/server/utils/email/send_template_email';
import { getEmailSignature } from '$lib/server/utils/email/signature';
import { getQueue } from '$lib/server/queue';

import pino from '$lib/pino';
const log = pino(import.meta.url);

export async function sendEventRegistration({
	eventSignupId,
	locale
}: {
	eventSignupId: string;
	locale: Locale;
}) {
	const signup = await drizzle.query.eventSignup.findFirst({
		where: eq(eventSignup.id, eventSignupId)
	});
	if (!signup) {
		throw new Error('Event signup not found');
	}

	const orgResult = await drizzle.query.organization.findFirst({
		where: eq(organization.id, signup.organizationId)
	});
	if (!orgResult) {
		throw new Error('Organization not found');
	}
	const eventResult = await drizzle.query.event.findFirst({
		where: eq(event.id, signup.eventId)
	});
	if (!eventResult) {
		throw new Error('Event not found');
	}
	const personResult = await drizzle.query.person.findFirst({
		where: eq(person.id, signup.personId)
	});
	if (!personResult) {
		throw new Error('Person not found');
	}
	if (!personResult.emailAddress) {
		log.debug(
			{ personId: personResult.id },
			'Person email address not found, not sending an event registration email'
		);
		return;
	}

	const context = eventRegistration({
		organization: orgResult,
		locale: locale,
		event: eventResult,
		person: personResult
	});

	const emailSignature = await getEmailSignature({
		emailFromSignatureId: orgResult.settings?.email?.defaultFromSignatureId,
		organization: orgResult
	});

	const sendEmailResult = await sendTemplateEmail({
		to: personResult.emailAddress,
		from: `${emailSignature.name} <${emailSignature.emailAddress}>`,
		context,
		stream: 'outbound',
		template: 'event-reminder-registration'
	});

	log.debug({ sendEmailResult, personId: personResult.id }, 'Event registration email sent');

	await drizzle
		.update(eventSignup)
		.set({
			signupNotificationSentAt: new Date()
		})
		.where(eq(eventSignup.id, eventSignupId));

	const queue = await getQueue();
	queue.insertActivity({
		organizationId: orgResult.id,
		personId: personResult.id,
		type: 'event_signup_email_sent',
		referenceId: eventSignupId,
		unread: false
	});
}
