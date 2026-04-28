import type { ServerTransaction } from '@rocicorp/zero';
import { type QueryContext, builder } from '$lib/zero/schema';
import { eq, and, isNull } from 'drizzle-orm';
import { person, personTeam, team } from '$lib/schema/drizzle';
import { personReadPermissions } from '$lib/zero/query/person/permissions';
import { getOrganizationByIdUnsafe } from '$lib/server/api/data/organization';
import { getQueue } from '$lib/server/queue';
import {
	createMutatorSchemaZero,
	type CreateMutatorSchemaZeroOutput,
	deleteMutatorSchemaZero,
	type DeleteMutatorSchemaZero,
	updateMutatorSchemaZero,
	type UpdateMutatorSchemaZeroOutput,
	personWebhook
} from '$lib/schema/person';
import { parse } from 'valibot';
import pino from '$lib/pino';
import { _addPersonTeamDataUnsafe, addPersonToTeam } from './team';
const log = pino(import.meta.url);
export async function createPerson({
	tx,
	ctx,
	args
}: {
	tx: ServerTransaction;
	ctx: QueryContext;
	args: CreateMutatorSchemaZeroOutput;
}) {
	const parsed = parse(createMutatorSchemaZero, args);
	const organizationRecord = await getOrganizationByIdUnsafe({
		organizationId: parsed.metadata.organizationId,
		tx
	});
	if (!organizationRecord) {
		throw new Error('Organization not found');
	}
	if (
		![...ctx.adminOrgs, ...ctx.ownerOrgs].includes(organizationRecord.id) &&
		!parsed.metadata.teamId
	) {
		throw new Error('You are not authorized to create a person in this organization');
	}

	if (parsed.metadata.teamId) {
		const [teamRecord] = await tx.dbTransaction.wrappedTransaction
			.select()
			.from(team)
			.where(eq(team.id, parsed.metadata.teamId))
			.limit(1);
		if (!teamRecord) {
			throw new Error('Team not found');
		}
		if (organizationRecord.id !== teamRecord.organizationId) {
			throw new Error('Team does not belong to organization');
		}
	}

	const personToImport: typeof person.$inferInsert = {
		...args.input,
		dateOfBirth: args.input.dateOfBirth ? new Date(args.input.dateOfBirth) : null,
		id: args.metadata.personId,
		organizationId: args.metadata.organizationId,
		addedFrom: args.metadata.addedFrom,
		mostRecentActivityAt: new Date(),
		createdAt: new Date(),
		updatedAt: new Date()
	};

	const [result] = await tx.dbTransaction.wrappedTransaction
		.insert(person)
		.values(personToImport)
		.returning();
	if (!result) {
		throw new Error('Unable to create person');
	}

	if (args.metadata.teamId) {
		await addPersonToTeam({
			tx,
			ctx,
			args: {
				metadata: {
					personId: result.id,
					teamId: args.metadata.teamId,
					organizationId: parsed.metadata.organizationId
				}
			}
		});
	}

	try {
		const queue = await getQueue();
		await queue.triggerWebhook({
			organizationId: parsed.metadata.organizationId,
			payload: {
				type: 'person.created',
				data: parse(personWebhook, result)
			}
		});
	} catch (err) {
		log.error({ err }, 'Failed to trigger webhook');
	}
	return result;
}

export async function updatePerson({
	tx,
	ctx,
	args
}: {
	tx: ServerTransaction;
	ctx: QueryContext;
	args: UpdateMutatorSchemaZeroOutput;
}) {
	const input = parse(updateMutatorSchemaZero, args);
	const personRecord = await tx.run(
		builder.person
			.where('id', '=', input.metadata.personId)
			.where('organizationId', '=', input.metadata.organizationId)
			.where('deletedAt', 'IS', null)
			.where((expr) => personReadPermissions(expr, ctx))
			.one()
	);
	if (!personRecord) {
		throw new Error('Person not found');
	}
	const updatedDateParsed = {
		...input.input,
		dateOfBirth: input.input.dateOfBirth ? new Date(input.input.dateOfBirth) : undefined
	};
	const [result] = await tx.dbTransaction.wrappedTransaction
		.update(person)
		.set({
			...updatedDateParsed,
			updatedAt: new Date()
		})
		.where(
			and(
				eq(person.id, input.metadata.personId),
				eq(person.organizationId, input.metadata.organizationId)
			)
		)
		.returning();
	if (!result) {
		throw new Error('Unable to update person');
	}
	try {
		const queue = await getQueue();
		await queue.triggerWebhook({
			organizationId: input.metadata.organizationId,
			payload: {
				type: 'person.updated',
				data: parse(personWebhook, result)
			}
		});
	} catch (err) {
		log.error({ err }, 'Failed to trigger webhook');
	}
	return result;
}

export async function deletePerson({
	tx,
	ctx,
	args
}: {
	tx: ServerTransaction;
	ctx: QueryContext;
	args: DeleteMutatorSchemaZero;
}) {
	const parsed = parse(deleteMutatorSchemaZero, args);
	const personRecord = await tx.run(
		builder.person
			.where('id', '=', parsed.metadata.personId)
			.where('organizationId', '=', parsed.metadata.organizationId)
			.where((expr) => personReadPermissions(expr, ctx))
			.one()
	);
	if (!personRecord) {
		throw new Error('Person not found');
	}

	await tx.dbTransaction.wrappedTransaction
		.update(person)
		.set({
			deletedAt: new Date()
		})
		.where(
			and(
				isNull(person.deletedAt),
				eq(person.id, args.metadata.personId),
				eq(person.organizationId, args.metadata.organizationId)
			)
		);
	try {
		const queue = await getQueue();
		await queue.triggerWebhook({
			organizationId: parsed.metadata.organizationId,
			payload: {
				type: 'person.deleted',
				data: { personId: parsed.metadata.personId }
			}
		});
	} catch (err) {
		log.error({ err }, 'Failed to trigger webhook');
	}
	return;
}

export async function _getPersonByPhoneNumberUnsafe({
	phoneNumber,
	organizationId,
	tx
}: {
	phoneNumber: string;
	organizationId: string;
	tx: ServerTransaction;
}) {
	const [personRecord] = await tx.dbTransaction.wrappedTransaction
		.select()
		.from(person)
		.where(
			and(
				eq(person.phoneNumber, phoneNumber),
				eq(person.organizationId, organizationId),
				isNull(person.deletedAt)
			)
		);
	if (!personRecord) {
		throw new Error('Person not found');
	}
	return personRecord;
}

export async function getPerson({
	tx,
	ctx,
	args
}: {
	tx: ServerTransaction;
	ctx: QueryContext;
	args: { organizationId: string; personId: string };
}) {
	const personRecord = await tx.run(
		builder.person
			.where('organizationId', '=', args.organizationId)
			.where('deletedAt', 'IS', null)
			.where('id', '=', args.personId)
			.where((expr) => personReadPermissions(expr, ctx))
			.one()
	);
	if (!personRecord) {
		throw new Error('Person not found');
	}
	return personRecord;
}

export async function _getPersonByIdUnsafe({
	personId,
	organizationId,
	tx
}: {
	personId: string;
	organizationId: string;
	tx: ServerTransaction;
}) {
	const [personRecord] = await tx.dbTransaction.wrappedTransaction
		.select()
		.from(person)
		.where(and(eq(person.id, personId), eq(person.organizationId, organizationId)));
	if (!personRecord) {
		throw new Error('Person not found');
	}
	return personRecord;
}

/**
 * Resolves organization id for a person by id without tenant or auth filters.
 * For trusted server callsites only; does not load name, email, or other PII.
 */
export async function _getPersonByIdUnsafeNoTenantCheck({
	personId,
	tx
}: {
	personId: string;
	tx: ServerTransaction;
}): Promise<string | null> {
	const [row] = await tx.dbTransaction.wrappedTransaction
		.select({ organizationId: person.organizationId })
		.from(person)
		.where(and(eq(person.id, personId), isNull(person.deletedAt)))
		.limit(1);
	return row?.organizationId ?? null;
}
