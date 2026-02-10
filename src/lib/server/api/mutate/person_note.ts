import { defineMutator } from '@rocicorp/zero';

import {
	createMutatorSchemaZero,
	updateMutatorSchemaZero,
	deleteMutatorSchemaZero
} from '$lib/schema/person-note';

import * as dataFunctions from '$lib/server/api/data/person/note';

export const createPersonNote = defineMutator(
	createMutatorSchemaZero,
	async ({ tx, args, ctx }) => {
		if (tx.location !== 'server') {
			throw new Error('createPersonNote can only be called from the server');
		}
		await dataFunctions.createPersonNote({ tx, ctx, args });
	}
);

export const updatePersonNote = defineMutator(
	updateMutatorSchemaZero,
	async ({ tx, args, ctx }) => {
		if (tx.location !== 'server') {
			throw new Error('updatePersonNote can only be called from the server');
		}
		await dataFunctions.updatePersonNote({ tx, ctx, args });
	}
);

export const deletePersonNote = defineMutator(
	deleteMutatorSchemaZero,
	async ({ tx, args, ctx }) => {
		if (tx.location !== 'server') {
			throw new Error('deletePersonNote can only be called from the server');
		}
		await dataFunctions.deletePersonNote({ tx, ctx, args });
	}
);
