import { defineMutator } from '@rocicorp/zero';
import {
	createEventZeroMutatorSchema,
	updateEventZeroMutatorSchema,
	deleteEventMutatorSchemaZero,
	archiveEventMutatorSchemaZero,
	postEventMutatorSchemaZero
} from '$lib/schema/event';
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

export const deleteEvent = defineMutator(
	deleteEventMutatorSchemaZero,
	async ({ tx, args, ctx }) => {
		if (tx.location !== 'server') {
			throw new Error('deleteEvent can only be called from the server');
		}
		await dataFunctions.deleteEvent({ tx, ctx, args });
	}
);

export const archiveEvent = defineMutator(
	archiveEventMutatorSchemaZero,
	async ({ tx, args, ctx }) => {
		if (tx.location !== 'server') {
			throw new Error('archiveEvent can only be called from the server');
		}
		await dataFunctions.archiveEvent({ tx, ctx, args });
	}
);

export const postEvent = defineMutator(postEventMutatorSchemaZero, async ({ tx, args, ctx }) => {
	if (tx.location !== 'server') {
		throw new Error('postEvent can only be called from the server');
	}
	await dataFunctions.postEvent({ tx, ctx, args });
});
