import { drizzle } from '$lib/server/db';
import { person, personTeam } from '$lib/schema/drizzle';
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
import { getQueue } from '$lib/server/queue';
import { personApiSchema } from '$lib/schema/person';
const log = pino(import.meta.url);

export async function findOrCreatePerson({
	personAction,
	addedFrom,
	updateExistingPerson = false,
	tx,
	organizationId,
	teamId
}: {
	personAction: PersonActionHelper;
	addedFrom: PersonAddedFrom;
	organizationId: string;
	updateExistingPerson?: boolean;
	teamId?: string;
	tx: ServerTransaction;
}) {
	const parsedActionHelper = parse(personActionHelper, personAction);
	const parsedAddedFrom = parse(personAddedFrom, addedFrom);
	const whereConditions = [];
	if (personAction.emailAddress) {
		whereConditions.push(eq(person.emailAddress, personAction.emailAddress));
	}
	if (personAction.phoneNumber) {
		whereConditions.push(eq(person.phoneNumber, personAction.phoneNumber));
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
				try {
					const queue = await getQueue();
					await queue.triggerWebhook({
						organizationId,
						payload: {
							type: 'person.updated',
							data: parse(personApiSchema, updatedPerson)
						}
					});
				} catch (err) {
					log.error({ err }, 'Failed to trigger webhook');
				}
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

	try {
		const queue = await getQueue();
		await queue.triggerWebhook({
			organizationId,
			payload: {
				type: 'person.created',
				data: parse(personApiSchema, insertedPerson)
			}
		});
	} catch (err) {
		log.error({ err }, 'Failed to trigger webhook');
	}
	return insertedPerson;
}
