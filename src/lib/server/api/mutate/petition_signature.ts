import {
	createMutatorSchema,
	updateMutatorSchema,
	deleteMutatorSchema
} from '$lib/schema/petition/petition-signature';

import { defineMutator } from '@rocicorp/zero';
import * as dataFunctions from '$lib/server/api/data/petition/signature';

export const createPetitionSignature = defineMutator(
	createMutatorSchema,
	async ({ tx, args, ctx }) => {
		if (tx.location !== 'server') {
			throw new Error('createPetitionSignature can only be called from the server');
		}
		await dataFunctions.createPetitionSignature({ tx, ctx, args });
	}
);

export const updatePetitionSignature = defineMutator(
	updateMutatorSchema,
	async ({ tx, args, ctx }) => {
		if (tx.location !== 'server') {
			throw new Error('updatePetitionSignature can only be called from the server');
		}
		await dataFunctions.updatePetitionSignature({ tx, ctx, args });
	}
);

export const deletePetitionSignature = defineMutator(
	deleteMutatorSchema,
	async ({ tx, args, ctx }) => {
		if (tx.location !== 'server') {
			throw new Error('deletePetitionSignature can only be called from the server');
		}
		await dataFunctions.deletePetitionSignature({ tx, ctx, args });
	}
);
