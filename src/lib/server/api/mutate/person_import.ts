import { defineMutator } from '@rocicorp/zero';
import * as dataFunctions from '$lib/server/api/data/person/imports';

import {
	createMutatorSchemaZero,
	triggerImportQueueMutatorSchema
} from '$lib/schema/person-import';

export const insertPersonImport = defineMutator(
	createMutatorSchemaZero,
	async ({ tx, args, ctx }) => {
		if (tx.location !== 'server') {
			throw new Error('insertPersonImport can only be called from the server');
		}
		await dataFunctions.insertPersonImport({ tx, ctx, args });
	}
);

export const triggerImportQueue = defineMutator(
	triggerImportQueueMutatorSchema,
	async ({ tx, args, ctx }) => {
		if (tx.location !== 'server') {
			throw new Error('triggerImportQueue can only be called from the server');
		}
		await dataFunctions.triggerImportQueue({ tx, ctx, args });
	}
);
