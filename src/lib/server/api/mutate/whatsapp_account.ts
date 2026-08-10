import { defineMutator } from '@rocicorp/zero';
import {
	createWhatsappAccountMutatorSchema,
	deleteWhatsappAccountMutatorSchema,
	unlinkWhatsappAccountMutatorSchema,
	updateWhatsappAccountMetadataMutatorSchema
} from '$lib/schema/whatsapp-account';
import * as dataFunctions from '$lib/server/api/data/whatsapp/account';

export const createWhatsappAccount = defineMutator(
	createWhatsappAccountMutatorSchema,
	async ({ tx, args, ctx }) => {
		if (tx.location !== 'server') {
			throw new Error('createWhatsappAccount can only be called from the server');
		}
		await dataFunctions.createWhatsappAccount({ tx, ctx, args });
	}
);

export const deleteWhatsappAccount = defineMutator(
	deleteWhatsappAccountMutatorSchema,
	async ({ tx, args, ctx }) => {
		if (tx.location !== 'server') {
			throw new Error('deleteWhatsappAccount can only be called from the server');
		}
		await dataFunctions.deleteWhatsappAccount({ tx, ctx, args });
	}
);

export const unlinkWhatsappAccount = defineMutator(
	unlinkWhatsappAccountMutatorSchema,
	async ({ tx, args, ctx }) => {
		if (tx.location !== 'server') {
			throw new Error('unlinkWhatsappAccount can only be called from the server');
		}
		await dataFunctions.unlinkWhatsappAccount({ tx, ctx, args });
	}
);

export const updateWhatsappAccountMetadata = defineMutator(
	updateWhatsappAccountMetadataMutatorSchema,
	async ({ tx, args, ctx }) => {
		if (tx.location !== 'server') {
			throw new Error('updateWhatsappAccountMetadata can only be called from the server');
		}
		await dataFunctions.updateWhatsappAccountMetadata({ tx, ctx, args });
	}
);
