import { type Transaction } from '@rocicorp/zero';
import { type Schema } from '$lib/zero/schema';

import {
	type CreateMutatorSchemaOutput,
	type UpdateMutatorSchemaOutput
} from '$lib/schema/petition/petition-signature';

export function createPetitionSignature() {
	return async function (tx: Transaction<Schema>, args: CreateMutatorSchemaOutput) {
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
	};
}

export function updatePetitionSignature() {
	return async function (tx: Transaction<Schema>, args: UpdateMutatorSchemaOutput) {
		tx.mutate.petitionSignature.update({
			id: args.metadata.petitionSignatureId,
			responses: args.input.responses,
			updatedAt: new Date().getTime()
		});
	};
}
