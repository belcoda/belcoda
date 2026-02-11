import * as dataFunctions from '$lib/server/api/data/webhook/webhook';
import { defineMutator } from '@rocicorp/zero';
import { createMutatorSchemaZero, deleteMutatorSchemaZero } from '$lib/schema/webhook';

export const createWebhook = defineMutator(createMutatorSchemaZero, async ({ tx, args, ctx }) => {
	if (tx.location !== 'server') {
		throw new Error('createWebhook can only be called from the server');
	}
	await dataFunctions.createWebhook({ tx, ctx, args });
});

export const deleteWebhook = defineMutator(deleteMutatorSchemaZero, async ({ tx, args, ctx }) => {
	if (tx.location !== 'server') {
		throw new Error('deleteWebhook can only be called from the server');
	}
	await dataFunctions.deleteWebhook({ tx, ctx, args });
});
