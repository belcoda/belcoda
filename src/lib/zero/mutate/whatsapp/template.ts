import { defineMutator } from '@rocicorp/zero';
import { createMutatorSchema, updateMutatorSchema } from '$lib/schema/whatsapp-template';

export const createWhatsappTemplate = defineMutator(
	createMutatorSchema,
	async ({ tx, args, ctx }) => {
		tx.mutate.whatsappTemplate.insert({
			id: args.metadata.whatsappTemplateId,
			organizationId: args.metadata.organizationId,
			name: args.input.name,
			locale: args.input.locale,
			components: args.input.components,
			createdAt: new Date().getTime(),
			updatedAt: new Date().getTime()
		});
	}
);

export const updateWhatsappTemplate = defineMutator(
	updateMutatorSchema,
	async ({ tx, args, ctx }) => {
		tx.mutate.whatsappTemplate.update({
			id: args.metadata.whatsappTemplateId,
			components: args.input.components,
			updatedAt: new Date().getTime()
		});
	}
);
