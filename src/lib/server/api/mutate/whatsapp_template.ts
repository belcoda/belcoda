import {
	createMutatorSchema,
	updateMutatorSchema,
	mutatorMetadata
} from '$lib/schema/whatsapp-template';

import { defineMutator } from '@rocicorp/zero';
import * as dataFunctions from '$lib/server/api/data/whatsapp/template';

export const createWhatsappTemplate = defineMutator(
	createMutatorSchema,
	async ({ tx, args, ctx }) => {
		if (tx.location !== 'server') {
			throw new Error('createWhatsappTemplate can only be called from the server');
		}
		await dataFunctions.createWhatsappTemplate({
			tx,
			ctx,
			args: {
				id: args.metadata.whatsappTemplateId,
				template: args.input,
				organizationId: args.metadata.organizationId
			}
		});
	}
);

export const updateWhatsappTemplate = defineMutator(
	updateMutatorSchema,
	async ({ tx, args, ctx }) => {
		if (tx.location !== 'server') {
			throw new Error('updateWhatsappTemplate can only be called from the server');
		}
		await dataFunctions.updateWhatsappTemplate({
			tx,
			ctx,
			args: {
				id: args.metadata.whatsappTemplateId,
				template: args.input,
				organizationId: args.metadata.organizationId
			}
		});
	}
);

export const submitWhatsappTemplate = defineMutator(mutatorMetadata, async ({ tx, args, ctx }) => {
	if (tx.location !== 'server') {
		throw new Error('submitWhatsappTemplate can only be called from the server');
	}
	await dataFunctions.submitWhatsappTemplate({
		tx,
		ctx,
		args: {
			whatsappTemplateId: args.whatsappTemplateId,
			organizationId: args.organizationId
		}
	});
});
