import type { MutatorParams } from '$lib/zero/schema';
import type { Transaction } from '$lib/server/db/zeroDrizzle';
import pino from '$lib/pino';
import { getQueue } from '$lib/server/queue';
import { type CreateMutatorSchemaZeroOutput } from '$lib/schema/person-import';
import { personImport } from '$lib/schema/drizzle';

const log = pino(import.meta.url);

export function insertPersonImport(_params: MutatorParams) {
	return async function (tx: Transaction, input: CreateMutatorSchemaZeroOutput) {
		log.debug({ input }, 'Inserting person import');

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

		await tx.dbTransaction.wrappedTransaction.insert(personImport).values(importRecord);
	};
}

export function triggerImportQueue(_params: MutatorParams) {
	return async function (
		_tx: Transaction,
		{
			personImportId,
			organizationId
		}: {
			personImportId: string;
			organizationId: string;
		}
	) {
		try {
			log.info({ personImportId, organizationId }, 'Triggering person import queue');
			const queue = await getQueue();
			await queue.importPeople({
				personImportId,
				organizationId
			});
		} catch (err) {
			log.error({ err, personImportId }, 'Failed to trigger person import queue');
			throw err;
		}
	};
}
