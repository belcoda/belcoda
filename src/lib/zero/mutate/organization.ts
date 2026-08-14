import { defineMutator } from '@rocicorp/zero';
import { updateOrganizationZeroMutatorSchema } from '$lib/schema/organization';
import {
	updateThemeZeroMutatorSchema,
	defaultOrganizationOnboardingSettings,
	updateOrganizationOnboardingZeroMutatorSchema,
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

export const updateOrganizationOnboarding = defineMutator(
	updateOrganizationOnboardingZeroMutatorSchema,
	async ({ tx, args }) => {
		tx.mutate.organization.update({
			id: args.metadata.organizationId,
			settings: {
				...args.metadata.existingSettings,
				onboarding: {
					...defaultOrganizationOnboardingSettings('complete'),
					...args.metadata.existingSettings.onboarding,
					...args.input
				}
			},
			updatedAt: Date.now()
		});
	}
);
