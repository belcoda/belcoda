import { defineMutator } from '@rocicorp/zero';
import {
	createWhatsappAccountMutatorSchema,
	deleteWhatsappAccountMutatorSchema,
	unlinkWhatsappAccountMutatorSchema,
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

// Unlinking an account soft-deletes it (stamps `deletedAt`), same as a delete.
// It is a distinct mutator because unlinking should eventually also detach the
// account at the WhatsApp provider.
export const unlinkWhatsappAccount = defineMutator(
	unlinkWhatsappAccountMutatorSchema,
	async ({ tx, args }) => {
		// todo: unlink with API
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
