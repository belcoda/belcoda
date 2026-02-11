import { type Transaction } from '@rocicorp/zero';
import { type Schema } from '$lib/zero/schema';
import { defineMutator } from '@rocicorp/zero';
import { createMutatorSchema, updateMutatorSchema } from '$lib/schema/petition/petition-signature';

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
			createdAt: new Date().getTime(),
			updatedAt: new Date().getTime()
		});
	}
);

export const updatePetitionSignature = defineMutator(
	updateMutatorSchema,
	async ({ tx, args, ctx }) => {
		tx.mutate.petitionSignature.update({
			id: args.metadata.petitionSignatureId,
			responses: args.input.responses,
			updatedAt: new Date().getTime()
		});
	}
);
