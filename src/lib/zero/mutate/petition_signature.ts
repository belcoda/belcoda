import { type Transaction } from '@rocicorp/zero';
import { type Schema } from '$lib/zero/schema';
import { defineMutator } from '@rocicorp/zero';
import {
	createMutatorSchema,
	updateMutatorSchema,
	deleteMutatorSchema
} from '$lib/schema/petition/petition-signature';

export const createPetitionSignature = defineMutator(
	createMutatorSchema,
	async ({ tx, args, ctx }) => {
		tx.mutate.petitionSignature.insert({
			id: args.metadata.petitionSignatureId,
			organizationId: args.metadata.organizationId,
			petitionId: args.metadata.petitionId,
			personId: args.metadata.personId,
			details: args.input.details,
			responses: args.input.responses,
			createdAt: Date.now(),
			updatedAt: Date.now()
		});
	}
);

export const updatePetitionSignature = defineMutator(
	updateMutatorSchema,
	async ({ tx, args, ctx }) => {
		tx.mutate.petitionSignature.update({
			id: args.metadata.petitionSignatureId,
			responses: args.input.responses,
			updatedAt: Date.now()
		});
	}
);

export const deletePetitionSignature = defineMutator(
	deleteMutatorSchema,
	async ({ tx, args, ctx }) => {
		tx.mutate.petitionSignature.update({
			id: args.metadata.petitionSignatureId,
			deletedAt: Date.now(),
			updatedAt: Date.now()
		});
	}
);
