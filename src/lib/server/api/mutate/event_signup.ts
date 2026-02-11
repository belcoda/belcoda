import { createMutatorSchema, updateMutatorSchema } from '$lib/schema/event-signup';
import * as dataFunctions from '$lib/server/api/data/event/signup';
import { defineMutator } from '@rocicorp/zero';

export const createEventSignup = defineMutator(createMutatorSchema, async ({ tx, args, ctx }) => {
	if (tx.location !== 'server') {
		throw new Error('createEventSignup can only be called from the server');
	}
	await dataFunctions.createEventSignup({ tx, ctx, args });
});
export const updateEventSignup = defineMutator(updateMutatorSchema, async ({ tx, args, ctx }) => {
	if (tx.location !== 'server') {
		throw new Error('updateEventSignup can only be called from the server');
	}
	await dataFunctions.updateEventSignup({ tx, ctx, args });
});
