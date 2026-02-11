import { defineMutator } from '@rocicorp/zero';

import { createMutatorSchema, triggerImportQueueMutatorSchema } from '$lib/schema/person-import';

export const insertPersonImport = defineMutator(createMutatorSchema, async ({ tx, args, ctx }) => {
	tx.mutate.personImport.insert({
		id: args.metadata.importId,
		organizationId: args.metadata.organizationId,
		csvUrl: args.input.csvUrl,
		status: 'pending',
		totalRows: 0,
		processedRows: 0,
		failedRows: 0,
		failedEntries: null,
		importedBy: args.metadata.importedBy,
		createdAt: new Date().getTime(),
		completedAt: null
	});
});

export const triggerImportQueue = defineMutator(
	triggerImportQueueMutatorSchema,
	async ({ tx, args, ctx }) => {
		// Server-side mutator will handle the actual queue triggering
		// personImportId and organizationId will be used by the server-side implementation
		return;
	}
);
