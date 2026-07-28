import type { ServerTransaction } from '@rocicorp/zero';
import type { QueryContext } from '$lib/zero/schema';

import { personImport } from '$lib/schema/drizzle';

import { parse } from 'valibot';
import { eq } from 'drizzle-orm';
import {
	createMutatorSchemaZero,
	type CreateMutatorSchemaZeroOutput,
	triggerImportQueueMutatorSchema,
	type TriggerImportQueueMutatorSchemaOutput,
	personImportApiSchema
} from '$lib/schema/person-import';

import { getQueue, queueSendOptionsFromTransaction } from '$lib/server/queue';
import { getOrganizationByIdForAdminOrOwner } from '$lib/server/api/data/organization';

export async function insertPersonImport({
	tx,
	ctx,
	args
}: {
	tx: ServerTransaction;
	ctx: QueryContext;
	args: CreateMutatorSchemaZeroOutput;
}) {
	const input = parse(createMutatorSchemaZero, args);
	if (!ctx.userId) {
		throw new Error('You must be logged in to import people');
	}
	const organizationRecord = await getOrganizationByIdForAdminOrOwner({
		tx,
		ctx,
		organizationId: input.metadata.organizationId
	});
	const importRecord: typeof personImport.$inferInsert = {
		id: input.metadata.importId,
		organizationId: organizationRecord.id,
		csvUrl: input.input.csvUrl,
		status: 'pending',
		totalRows: 0,
		processedRows: 0,
		failedRows: 0,
		failedEntries: null,
		importedBy: ctx.userId,
		createdAt: new Date(),
		completedAt: null
	};

	const [inserted] = await tx.dbTransaction.wrappedTransaction
		.insert(personImport)
		.values(importRecord)
		.returning();
	if (!inserted) {
		throw new Error('Failed to insert person import');
	}
	const { organizationId, ...importWebhookData } = inserted;
	const queue = await getQueue();
	await queue.triggerWebhook(
		{
			organizationId,
			payload: {
				type: 'person.import.created',
				data: parse(personImportApiSchema, importWebhookData)
			}
		},
		queueSendOptionsFromTransaction(tx)
	);
	return inserted;
}

export async function triggerImportQueue({
	tx,
	ctx,
	args
}: {
	tx: ServerTransaction;
	ctx: QueryContext;
	args: TriggerImportQueueMutatorSchemaOutput;
}) {
	const parsed = parse(triggerImportQueueMutatorSchema, args);
	const importRecord = await tx.dbTransaction.wrappedTransaction.query.personImport.findFirst({
		where: eq(personImport.id, parsed.metadata.importId)
	});
	if (!importRecord) {
		throw new Error('Person import not found');
	}
	if (![...ctx.adminOrgs, ...ctx.ownerOrgs].includes(importRecord.organizationId)) {
		throw new Error('You are not authorized to trigger this person import');
	}
	const queue = await getQueue();
	await queue.importPeople({
		personImportId: importRecord.id,
		organizationId: importRecord.organizationId
	});
}
