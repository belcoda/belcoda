import { defineMutator } from '@rocicorp/zero';
import { createEventZeroMutatorSchema, updateEventZeroMutatorSchema } from '$lib/schema/event';
import * as dataFunctions from '$lib/server/api/data/event/event';

export const createEvent = defineMutator(
	createEventZeroMutatorSchema,
	async ({ tx, args, ctx }) => {
		if (tx.location !== 'server') {
			throw new Error('createEvent can only be called from the server');
		}
		await dataFunctions.createEvent({ tx, ctx, args });
	}
);

export const updateEvent = defineMutator(
	updateEventZeroMutatorSchema,
	async ({ tx, args, ctx }) => {
		if (tx.location !== 'server') {
			throw new Error('updateEvent can only be called from the server');
		}
		await dataFunctions.updateEvent({ tx, ctx, args });
	}
);
