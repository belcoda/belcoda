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
	number: v.optional(v.nullable(helpers.phoneNumber), null)
});

export type WhatsappOrganizationSettingsSchema = v.InferOutput<
	typeof whatsappOrganizationSettingsSchema
>;

export function defaultWhatsappOrganizationSettings(): WhatsappOrganizationSettingsSchema {
	return {
		wabaId: null,
		number: null
	};
}

export const emailOrganizationSettingsSchema = v.object({
	systemFromIdentity: v.object({
		name: v.optional(v.nullable(helpers.shortString), null),
		replyTo: v.optional(v.nullable(helpers.email), null)
	}),
	defaultFromSignatureId: v.optional(v.nullable(helpers.uuid), null)
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

export const organizationSettingsSchema = v.object({
	whatsApp: whatsappOrganizationSettingsSchema,
	email: emailOrganizationSettingsSchema,
	theme: themeSettingsSchema
});

export type OrganizationSettingsSchema = v.InferOutput<typeof organizationSettingsSchema>;

export const defaultDisplaySettings = {
	primaryColor: '#4f46e5',
	secondaryColor: '#10b981'
};

export function defaultOrganizationSettings(): OrganizationSettingsSchema {
	return {
		whatsApp: defaultWhatsappOrganizationSettings(),
		email: defaultEmailOrganizationSettings(),
		theme: defaultThemeSettings()
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
