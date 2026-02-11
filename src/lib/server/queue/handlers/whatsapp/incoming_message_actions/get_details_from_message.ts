import { drizzle } from '$lib/server/db';
import { organization, person as personTable } from '$lib/schema/drizzle';
import { eq, and, sql } from 'drizzle-orm';
import { getCountryCodeFromPhoneNumber } from '$lib/utils/phone';
import type { ServerTransaction } from '@rocicorp/zero';
import { findOrCreatePerson } from '$lib/server/api/data/person/findOrCreate';

export async function getDetailsFromMessageByWabaId({
	wabaId,
	messageId,
	teamId,
	personPhoneNumber,
	personName,
	tx
}: {
	wabaId: string;
	messageId: string;
	teamId?: string;
	personPhoneNumber: string;
	personName: string;
	tx: ServerTransaction;
}) {
	const orgResult = await tx.dbTransaction.wrappedTransaction
		.select()
		.from(organization)
		.where(sql`${organization.settings}->'whatsApp'->>'wabaId' = ${wabaId}`);

	if (orgResult.length === 0) {
		throw new Error('No organization found for wabaId: ' + wabaId);
	}

	if (orgResult.length !== 1) {
		throw new Error('Multiple organizations found for wabaId: ' + wabaId);
	}

	const person = await findOrCreatePerson({
		personAction: {
			phoneNumber: personPhoneNumber,
			givenName: personName,
			country: getCountryCodeFromPhoneNumber(personPhoneNumber) || orgResult[0].country,
			subscribed: false
		},
		teamId,
		addedFrom: { type: 'incoming_whatsapp_message', messageId },
		organizationId: orgResult[0].id,
		tx
	});

	return { organization: orgResult[0], person };
}
