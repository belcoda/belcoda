import * as dataFunctions from '$lib/server/api/data/tag/tag';
import { defineMutator } from '@rocicorp/zero';
import { updateMutatorSchema, createMutatorSchema, deleteMutatorSchema } from '$lib/schema/tag';

export const createTag = defineMutator(createMutatorSchema, async ({ tx, args, ctx }) => {
	if (tx.location !== 'server') {
		throw new Error('createTag can only be called from the server');
	}
	await dataFunctions.createTag({ tx, ctx, args });
});

export const updateTag = defineMutator(updateMutatorSchema, async ({ tx, args, ctx }) => {
	if (tx.location !== 'server') {
		throw new Error('updateTag can only be called from the server');
	}
	await dataFunctions.updateTag({ tx, ctx, args });
});

export const deleteTag = defineMutator(deleteMutatorSchema, async ({ tx, args, ctx }) => {
	if (tx.location !== 'server') {
		throw new Error('deleteTag can only be called from the server');
	}
	await dataFunctions.deleteTag({ tx, ctx, args });
});
