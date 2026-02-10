import type { ServerTransaction } from '@rocicorp/zero';
import type { QueryContext } from '$lib/zero/schema';

import { personImport } from '$lib/schema/drizzle';

import { parse } from 'valibot';
import {
	createMutatorSchemaZero,
	type CreateMutatorSchemaZeroOutput,
	triggerImportQueueMutatorSchema,
	type TriggerImportQueueMutatorSchemaOutput
} from '$lib/schema/person-import';

import { getQueue } from '$lib/server/queue';

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
	const importRecord: typeof personImport.$inferInsert = {
		id: input.metadata.importId,
		organizationId: input.metadata.organizationId,
		csvUrl: input.input.csvUrl,
		status: 'pending',
		totalRows: 0,
		processedRows: 0,
		failedRows: 0,
		failedEntries: null,
		importedBy: input.metadata.importedBy,
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
	const queue = await getQueue();
	await queue.importPeople({
		personImportId: parsed.metadata.importId,
		organizationId: parsed.metadata.organizationId
	});
}
