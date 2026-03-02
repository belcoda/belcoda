import { defineMutator } from '@rocicorp/zero';

import {
	createPetitionZeroMutatorSchema,
	updatePetitionZeroMutatorSchema,
	archivePetitionMutatorSchema,
	deletePetitionMutatorSchema
} from '$lib/schema/petition/petition';

import * as dataFunctions from '$lib/server/api/data/petition/petition';

export const createPetition = defineMutator(
	createPetitionZeroMutatorSchema,
	async ({ tx, args, ctx }) => {
		if (tx.location !== 'server') {
			throw new Error('createPetition can only be called from the server');
		}
		await dataFunctions.createPetition({ tx, ctx, args });
	}
);

export const updatePetition = defineMutator(
	updatePetitionZeroMutatorSchema,
	async ({ tx, args, ctx }) => {
		if (tx.location !== 'server') {
			throw new Error('updatePetition can only be called from the server');
		}
		await dataFunctions.updatePetition({ tx, ctx, args });
	}
);

export const archivePetition = defineMutator(
	archivePetitionMutatorSchema,
	async ({ tx, args, ctx }) => {
		if (tx.location !== 'server') {
			throw new Error('archivePetition can only be called from the server');
		}
		await dataFunctions.archivePetition({ tx, ctx, args });
	}
);

export const deletePetition = defineMutator(
	deletePetitionMutatorSchema,
	async ({ tx, args, ctx }) => {
		if (tx.location !== 'server') {
			throw new Error('deletePetition can only be called from the server');
		}
		await dataFunctions.deletePetition({ tx, ctx, args });
	}
);
