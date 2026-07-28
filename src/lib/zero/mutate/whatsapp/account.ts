import { defineMutator } from '@rocicorp/zero';
import {
	createWhatsappAccountMutatorSchema,
	deleteWhatsappAccountMutatorSchema,
	updateWhatsappAccountMetadataMutatorSchema
} from '$lib/schema/whatsapp-account';

const now = () => Date.now();

export const createWhatsappAccount = defineMutator(
	createWhatsappAccountMutatorSchema,
	async ({ tx, args }) => {
		tx.mutate.whatsappAccount.insert({
			id: args.metadata.whatsappAccountId,
			referenceId: args.input.referenceId,
			scope: args.input.scope,
			identifier: args.input.identifier,
			details: args.input.details,
			metadata: args.input.metadata,
			createdAt: now(),
			updatedAt: now(),
			deletedAt: null
		});
	}
);

// "Removing" an account is a soft delete: the row is retained but marked deleted.
export const deleteWhatsappAccount = defineMutator(
	deleteWhatsappAccountMutatorSchema,
	async ({ tx, args }) => {
		tx.mutate.whatsappAccount.update({
			id: args.metadata.whatsappAccountId,
			deletedAt: now(),
			updatedAt: now()
		});
	}
);

export const updateWhatsappAccountMetadata = defineMutator(
	updateWhatsappAccountMetadataMutatorSchema,
	async ({ tx, args }) => {
		tx.mutate.whatsappAccount.update({
			id: args.metadata.whatsappAccountId,
			metadata: args.input.metadata,
			updatedAt: now()
		});
	}
);
