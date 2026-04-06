import { type Transaction } from '@rocicorp/zero';
import { type Schema, builder } from '$lib/zero/schema';
import { defineMutator } from '@rocicorp/zero';
import {
	type UpdateOrganizationZeroMutatorSchema,
	updateOrganizationZeroMutatorSchema,
	type UpdateOrganizationWhatsappSettings
} from '$lib/schema/organization';
import {
	type UpdateThemeZeroMutatorSchema,
	updateThemeZeroMutatorSchema,
	updateWhatsappOrganizationSettingsZeroMutatorSchema
} from '$lib/schema/organization/settings';

export const updateOrganization = defineMutator(
	updateOrganizationZeroMutatorSchema,
	async ({ tx, args, ctx }) => {
		tx.mutate.organization.update({
			id: args.metadata.organizationId,
			...args.input,
			updatedAt: Date.now()
		});
	}
);

export const updateTheme = defineMutator(
	updateThemeZeroMutatorSchema,
	async ({ tx, args, ctx }) => {
		tx.mutate.organization.update({
			id: args.metadata.organizationId,
			settings: {
				...args.metadata.existingSettings,
				theme: {
					...args.metadata.existingSettings?.theme,
					...args.input
				}
			},
			updatedAt: Date.now()
		});
	}
);

export const updateOrganizationWhatsappSettings = defineMutator(
	updateWhatsappOrganizationSettingsZeroMutatorSchema,
	async ({ tx, args, ctx }) => {
		tx.mutate.organization.update({
			id: args.metadata.organizationId,
			settings: {
				...args.metadata.existingSettings,
				whatsApp: {
					...args.metadata.existingSettings?.whatsApp,
					...args.input
				}
			},
			updatedAt: Date.now()
		});
	}
);
