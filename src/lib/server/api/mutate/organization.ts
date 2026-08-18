import { updateThemeZeroMutatorSchema } from '$lib/schema/organization/settings';
import {
	updateOrganizationZeroMutatorSchema,
	updateOrganizationWhatsappSettingsMutatorSchema
} from '$lib/schema/organization';
import { defineMutator } from '@rocicorp/zero';
import * as dataFunctions from '$lib/server/api/data/organization';

export const updateOrganization = defineMutator(
	updateOrganizationZeroMutatorSchema,
	async ({ tx, args, ctx }) => {
		if (tx.location !== 'server') {
			throw new Error('updateOrganization can only be called from the server');
		}
		await dataFunctions.updateOrganization({ tx, ctx, args });
	}
);

export const updateOrganizationWhatsappSettings = defineMutator(
	updateOrganizationWhatsappSettingsMutatorSchema,
	async ({ tx, args, ctx }) => {
		if (tx.location !== 'server') {
			throw new Error('updateOrganizationWhatsappSettings can only be called from the server');
		}
		await dataFunctions.updateOrganizationWhatsappSettings({ tx, ctx, args });
	}
);

export const updateTheme = defineMutator(
	updateThemeZeroMutatorSchema,
	async ({ tx, args, ctx }) => {
		if (tx.location !== 'server') {
			throw new Error('updateTheme can only be called from the server');
		}
		await dataFunctions.updateTheme({ tx, ctx, args });
	}
);
