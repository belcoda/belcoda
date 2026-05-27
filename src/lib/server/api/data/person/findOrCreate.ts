import { drizzle } from '$lib/server/db';
import { person, personTeam, personWhatsappIdentity, whatsappMessage } from '$lib/schema/drizzle';
import { eq, or, and, isNull } from 'drizzle-orm';

import { personActionHelper, type PersonActionHelper } from '$lib/schema/person';
import {
	personAddedFrom,
	DEFAULT_SOCIAL_MEDIA,
	type PersonAddedFrom
} from '$lib/schema/person/meta';

import { v7 as uuidv7 } from 'uuid';
import { parse } from 'valibot';

import pino from '$lib/pino';
import type { ServerTransaction } from '@rocicorp/zero';
import { personApiSchema } from '$lib/schema/person';
import { getQueue, queueSendOptionsFromTransaction } from '$lib/server/queue';
const log = pino(import.meta.url);

export type WhatsappIdentityLookup = {
	wabaId: string;
	bsuid?: string | null;
};

async function _findPersonByWhatsappIdentityUnsafe({
	organizationId,
	whatsappIdentity,
	tx
}: {
	organizationId: string;
	whatsappIdentity?: WhatsappIdentityLookup;
	tx: ServerTransaction;
}) {
	if (!whatsappIdentity?.wabaId || !whatsappIdentity.bsuid) {
		return undefined;
	}

	const [personRecord] = await tx.dbTransaction.wrappedTransaction
		.select({
			id: person.id,
			organizationId: person.organizationId,
			familyName: person.familyName,
			givenName: person.givenName,
			addressLine1: person.addressLine1,
			addressLine2: person.addressLine2,
			locality: person.locality,
			region: person.region,
			postcode: person.postcode,
			country: person.country,
			preferredLanguage: person.preferredLanguage,
			workplace: person.workplace,
			position: person.position,
			gender: person.gender,
			dateOfBirth: person.dateOfBirth,
			emailAddress: person.emailAddress,
			subscribed: person.subscribed,
			doNotContact: person.doNotContact,
			phoneNumber: person.phoneNumber,
			whatsAppUsername: person.whatsAppUsername,
			socialMedia: person.socialMedia,
			externalId: person.externalId,
			mostRecentActivityAt: person.mostRecentActivityAt,
			mostRecentActivityPreview: person.mostRecentActivityPreview,
			mostRecentWhatsappMessageReceivedAt: person.mostRecentWhatsappMessageReceivedAt,
			profilePicture: person.profilePicture,
			addedFrom: person.addedFrom,
			createdAt: person.createdAt,
			updatedAt: person.updatedAt,
			deletedAt: person.deletedAt
		})
		.from(personWhatsappIdentity)
		.innerJoin(person, eq(person.id, personWhatsappIdentity.personId))
		.where(
			and(
				isNull(personWhatsappIdentity.deletedAt),
				isNull(person.deletedAt),
				eq(personWhatsappIdentity.organizationId, organizationId),
				eq(personWhatsappIdentity.wabaId, whatsappIdentity.wabaId),
				eq(personWhatsappIdentity.bsuid, whatsappIdentity.bsuid),
				eq(person.organizationId, organizationId)
			)
		);
	return personRecord;
}

async function _findPersonByWhatsappContextMessageUnsafe({
	organizationId,
	whatsappContextWamidId,
	tx
}: {
	organizationId: string;
	whatsappContextWamidId?: string;
	tx: ServerTransaction;
}) {
	if (!whatsappContextWamidId) {
		return undefined;
	}

	const [personRecord] = await tx.dbTransaction.wrappedTransaction
		.select({
			id: person.id,
			organizationId: person.organizationId,
			familyName: person.familyName,
			givenName: person.givenName,
			addressLine1: person.addressLine1,
			addressLine2: person.addressLine2,
			locality: person.locality,
			region: person.region,
			postcode: person.postcode,
			country: person.country,
			preferredLanguage: person.preferredLanguage,
			workplace: person.workplace,
			position: person.position,
			gender: person.gender,
			dateOfBirth: person.dateOfBirth,
			emailAddress: person.emailAddress,
			subscribed: person.subscribed,
			doNotContact: person.doNotContact,
			phoneNumber: person.phoneNumber,
			whatsAppUsername: person.whatsAppUsername,
			socialMedia: person.socialMedia,
			externalId: person.externalId,
			mostRecentActivityAt: person.mostRecentActivityAt,
			mostRecentActivityPreview: person.mostRecentActivityPreview,
			mostRecentWhatsappMessageReceivedAt: person.mostRecentWhatsappMessageReceivedAt,
			profilePicture: person.profilePicture,
			addedFrom: person.addedFrom,
			createdAt: person.createdAt,
			updatedAt: person.updatedAt,
			deletedAt: person.deletedAt
		})
		.from(whatsappMessage)
		.innerJoin(person, eq(person.id, whatsappMessage.personId))
		.where(
			and(
				isNull(person.deletedAt),
				eq(whatsappMessage.organizationId, organizationId),
				eq(whatsappMessage.wamidId, whatsappContextWamidId),
				eq(person.organizationId, organizationId)
			)
		);
	return personRecord;
}

export async function findOrCreatePerson({
	personAction,
	addedFrom,
	updateExistingPerson = false,
	tx,
	organizationId,
	teamId,
	whatsappIdentity,
	whatsappContextWamidId
}: {
	personAction: PersonActionHelper;
	addedFrom: PersonAddedFrom;
	organizationId: string;
	updateExistingPerson?: boolean;
	teamId?: string;
	whatsappIdentity?: WhatsappIdentityLookup;
	whatsappContextWamidId?: string;
	tx: ServerTransaction;
}) {
	const parsedActionHelper = parse(personActionHelper, personAction);
	const parsedAddedFrom = parse(personAddedFrom, addedFrom);

	const identityPerson = await _findPersonByWhatsappIdentityUnsafe({
		organizationId,
		whatsappIdentity,
		tx
	});
	if (identityPerson) {
		return identityPerson;
	}

	const contextPerson = await _findPersonByWhatsappContextMessageUnsafe({
		organizationId,
		whatsappContextWamidId,
		tx
	});
	if (contextPerson) {
		return contextPerson;
	}

	const whereConditions = [];
	if (parsedActionHelper.emailAddress) {
		whereConditions.push(eq(person.emailAddress, parsedActionHelper.emailAddress));
	}
	if (parsedActionHelper.phoneNumber) {
		whereConditions.push(eq(person.phoneNumber, parsedActionHelper.phoneNumber));
	}

	// there should only ever be one because there is a unique index against organizationId and phoneNumber/emailAddress
	const [personRecord] = await tx.dbTransaction.wrappedTransaction
		.select()
		.from(person)
		.where(
			and(
				isNull(person.deletedAt),
				eq(person.organizationId, organizationId),
				or(...whereConditions)
			)
		);

	if (personRecord) {
		if (updateExistingPerson) {
			try {
				const [updatedPerson] = await tx.dbTransaction.wrappedTransaction
					.update(person)
					.set({
						...parsedActionHelper,
						preferredLanguage: parsedActionHelper.preferredLanguage || undefined,
						updatedAt: new Date()
					})
					.where(eq(person.id, personRecord.id))
					.returning();
				if (!updatedPerson) {
					throw new Error('Unable to update person');
				}
				const queue = await getQueue();
				await queue.triggerWebhook(
					{
						organizationId,
						payload: {
							type: 'person.updated',
							data: parse(personApiSchema, updatedPerson)
						}
					},
					queueSendOptionsFromTransaction(tx)
				);
				return updatedPerson;
			} catch (error) {
				log.error({ error }, 'Unable to update person');
			}
		}
		return personRecord;
	}
	// create a new person
	const input: typeof person.$inferInsert = {
		...parsedActionHelper,
		preferredLanguage: parsedActionHelper.preferredLanguage || 'en',
		id: uuidv7(),
		organizationId: organizationId,
		addedFrom: parsedAddedFrom,
		mostRecentActivityAt: new Date(),
		createdAt: new Date(),
		updatedAt: new Date(),
		doNotContact: false,
		socialMedia: DEFAULT_SOCIAL_MEDIA,
		mostRecentActivityPreview: null,
		deletedAt: null
	};

	const [insertedPerson] = await tx.dbTransaction.wrappedTransaction
		.insert(person)
		.values(input)
		.returning();
	if (!insertedPerson) {
		throw new Error('Unable to create person');
	}

	//if teamId is provided, add the person to the team
	if (teamId) {
		await drizzle.insert(personTeam).values({
			personId: insertedPerson.id,
			teamId: teamId,
			organizationId: organizationId,
			createdAt: new Date()
		});
	}

	const queue = await getQueue();
	await queue.triggerWebhook(
		{
			organizationId,
			payload: {
				type: 'person.created',
				data: parse(personApiSchema, insertedPerson)
			}
		},
		queueSendOptionsFromTransaction(tx)
	);
	return insertedPerson;
}
