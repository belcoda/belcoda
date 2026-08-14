import * as v from 'valibot';
import * as helpers from '$lib/schema/helpers';

export const themeSettingsSchema = v.object({
	favicon: v.optional(v.nullable(helpers.url), null),
	primaryColor: v.optional(v.nullable(helpers.hexColor), null),
	secondaryColor: v.optional(v.nullable(helpers.hexColor), null)
});

export type ThemeSettingsSchema = v.InferOutput<typeof themeSettingsSchema>;

export function defaultThemeSettings(): ThemeSettingsSchema {
	return {
		favicon: null,
		primaryColor: null,
		secondaryColor: null
	};
}

export const whatsappOrganizationSettingsSchema = v.object({
	wabaId: v.optional(v.nullable(helpers.shortString), null),
	number: v.optional(v.nullable(helpers.phoneNumber), null),
	defaultTemplateId: v.optional(v.nullable(helpers.uuid), null)
});

export type WhatsappOrganizationSettingsSchema = v.InferOutput<
	typeof whatsappOrganizationSettingsSchema
>;

export function defaultWhatsappOrganizationSettings(): WhatsappOrganizationSettingsSchema {
	return {
		wabaId: null,
		number: null,
		defaultTemplateId: null
	};
}

export const emailOrganizationSettingsSchema = v.object({
	systemFromIdentity: v.object({
		name: v.optional(v.nullable(helpers.shortString), null),
		replyTo: v.optional(v.nullable(helpers.email), null)
	}),
	defaultFromSignatureId: v.optional(v.nullable(helpers.uuid), null)
});

export const websiteOrganizationSettingsSchema = v.object({
	homepageUrl: v.optional(v.nullable(helpers.domainNameOrUrl))
});

export type EmailOrganizationSettingsSchema = v.InferOutput<typeof emailOrganizationSettingsSchema>;

export function defaultEmailOrganizationSettings(): EmailOrganizationSettingsSchema {
	return {
		systemFromIdentity: {
			name: null,
			replyTo: null
		},
		defaultFromSignatureId: null
	};
}

export const organizationOnboardingStatusSchema = v.picklist(['pending', 'skipped', 'complete']);
export type OrganizationOnboardingStatusSchema = v.InferOutput<
	typeof organizationOnboardingStatusSchema
>;

export const organizationOnboardingSettingsSchema = v.object({
	whatsappAccount: organizationOnboardingStatusSchema,
	event: organizationOnboardingStatusSchema,
	publishEvent: organizationOnboardingStatusSchema,
	other: organizationOnboardingStatusSchema,
	advanced: organizationOnboardingStatusSchema
});
export type OrganizationOnboardingSettingsSchema = v.InferOutput<
	typeof organizationOnboardingSettingsSchema
>;

export function defaultOrganizationOnboardingSettings(
	status: OrganizationOnboardingStatusSchema = 'pending'
): OrganizationOnboardingSettingsSchema {
	return {
		whatsappAccount: status,
		event: status,
		publishEvent: status,
		other: status,
		advanced: status
	};
}

export function organizationOnboardingIsComplete(
	settings: OrganizationOnboardingSettingsSchema
): boolean {
	return Object.values(settings).every((status) => status !== 'pending');
}

export const organizationSettingsSchema = v.object({
	whatsApp: whatsappOrganizationSettingsSchema,
	email: emailOrganizationSettingsSchema,
	theme: themeSettingsSchema,
	website: websiteOrganizationSettingsSchema,
	// Optional for organizations created before the onboarding settings were introduced.
	onboarding: v.optional(organizationOnboardingSettingsSchema)
});

export type OrganizationSettingsSchema = v.InferOutput<typeof organizationSettingsSchema>;

export const defaultDisplaySettings = {
	primaryColor: '#4f46e5',
	secondaryColor: '#10b981'
};

export function defaultOrganizationSettings({
	onboardingStatus = 'complete'
}: {
	onboardingStatus?: OrganizationOnboardingStatusSchema;
} = {}): OrganizationSettingsSchema {
	return {
		whatsApp: defaultWhatsappOrganizationSettings(),
		email: defaultEmailOrganizationSettings(),
		theme: defaultThemeSettings(),
		website: {
			homepageUrl: null
		},
		onboarding: defaultOrganizationOnboardingSettings(onboardingStatus)
	};
}

export const updateThemeZeroMutatorSchema = v.object({
	metadata: v.object({
		organizationId: helpers.uuid,
		existingSettings: organizationSettingsSchema
	}),
	input: themeSettingsSchema
});
export type UpdateThemeZeroMutatorSchema = v.InferOutput<typeof updateThemeZeroMutatorSchema>;

export const updateWhatsappOrganizationSettingsZeroMutatorSchema = v.object({
	metadata: v.object({
		organizationId: helpers.uuid,
		existingSettings: organizationSettingsSchema
	}),
	input: whatsappOrganizationSettingsSchema
});
export type UpdateWhatsappOrganizationSettingsZeroMutatorSchema = v.InferOutput<
	typeof updateWhatsappOrganizationSettingsZeroMutatorSchema
>;

export const updateOrganizationOnboardingZeroMutatorSchema = v.object({
	metadata: v.object({
		organizationId: helpers.uuid,
		existingSettings: organizationSettingsSchema
	}),
	input: v.partial(organizationOnboardingSettingsSchema)
});
export type UpdateOrganizationOnboardingZeroMutatorSchema = v.InferOutput<
	typeof updateOrganizationOnboardingZeroMutatorSchema
>;
