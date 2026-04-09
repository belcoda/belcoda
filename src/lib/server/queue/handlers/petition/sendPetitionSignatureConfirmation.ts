import { petitionSignatureConfirmation } from '$lib/server/utils/email/context/transactional/petition_signature_confirmation';
import { drizzle } from '$lib/server/db';
import { petitionSignature, organization, petition, person } from '$lib/schema/drizzle';
import { eq } from 'drizzle-orm';
import { type Locale } from '$lib/utils/language';
import sendTemplateEmail from '$lib/server/utils/email/send_template_email';
import { getEmailSignature } from '$lib/server/utils/email/signature';

import pino from '$lib/pino';
const log = pino(import.meta.url);

export async function sendPetitionSignatureConfirmation({
	petitionSignatureId,
	locale
}: {
	petitionSignatureId: string;
	locale: Locale;
}) {
	const signature = await drizzle.query.petitionSignature.findFirst({
		where: eq(petitionSignature.id, petitionSignatureId)
	});
	if (!signature) {
		throw new Error('Petition signature not found');
	}

	const orgResult = await drizzle.query.organization.findFirst({
		where: eq(organization.id, signature.organizationId)
	});
	if (!orgResult) {
		throw new Error('Organization not found');
	}
	const petitionResult = await drizzle.query.petition.findFirst({
		where: eq(petition.id, signature.petitionId)
	});
	if (!petitionResult) {
		throw new Error('Petition not found');
	}
	const personResult = await drizzle.query.person.findFirst({
		where: eq(person.id, signature.personId)
	});
	if (!personResult) {
		throw new Error('Person not found');
	}
	if (!personResult.emailAddress) {
		log.debug(
			{ personId: personResult.id },
			'Person email address not found, not sending a petition signature confirmation email'
		);
		return;
	}

	const context = await petitionSignatureConfirmation({
		organization: orgResult,
		locale,
		petition: petitionResult,
		person: personResult
	});

	const emailSignature = await getEmailSignature({
		emailFromSignatureId: orgResult.settings.email.defaultFromSignatureId,
		organization: orgResult
	});

	const sendEmailResult = await sendTemplateEmail({
		to: personResult.emailAddress,
		from: `${emailSignature.name} <${emailSignature.emailAddress}>`,
		context,
		stream: 'outbound',
		template: 'transactional'
	});

	log.debug(
		{ sendEmailResult, personId: personResult.id },
		'Petition signature confirmation email sent'
	);
}
