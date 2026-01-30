import * as v from 'valibot';
import * as helpers from '$lib/schema/helpers';
import {
	organizationSettingsSchema,
	defaultOrganizationSettings,
	whatsappOrganizationSettingsSchema
} from '$lib/schema/organization/settings';
import { organizationNameSchema, organizationSlugSchema } from '$lib/schema/organization/names';

export const organizationSchema = v.object({
	id: helpers.uuid,
	name: organizationNameSchema,
	slug: organizationSlugSchema,
	logo: v.nullable(helpers.url),
	icon: v.nullable(helpers.url),
	country: helpers.countryCode,
	defaultLanguage: helpers.languageCode,
	defaultTimezone: helpers.shortString,
	settings: organizationSettingsSchema,
	balance: helpers.count,
	createdAt: helpers.date,
	updatedAt: helpers.date
});
export type OrganizationSchema = v.InferOutput<typeof organizationSchema>;

export const readOrganizationRest = v.object({
	...organizationSchema.entries,
	createdAt: helpers.dateToString,
	updatedAt: helpers.dateToString
});
export type ReadOrganizationRest = v.InferOutput<typeof readOrganizationRest>;

export const readOrganizationZero = v.object({
	...organizationSchema.entries,
	createdAt: helpers.dateToTimestamp,
	updatedAt: helpers.dateToTimestamp
});
export type ReadOrganizationZero = v.InferOutput<typeof readOrganizationZero>;

export const createOrganization = v.object({
	name: organizationSchema.entries.name,
	slug: organizationSchema.entries.slug,
	logo: v.optional(organizationSchema.entries.logo, null),
	icon: v.optional(organizationSchema.entries.icon, null),
	country: organizationSchema.entries.country,
	defaultLanguage: organizationSchema.entries.defaultLanguage,
	defaultTimezone: organizationSchema.entries.defaultTimezone,
	settings: v.optional(organizationSettingsSchema, defaultOrganizationSettings())
});
export type CreateOrganization = v.InferInput<typeof createOrganization>;

export const updateOrganization = v.partial(
	v.object({
		logo: organizationSchema.entries.logo,
		icon: organizationSchema.entries.icon,
		country: organizationSchema.entries.country,
		defaultLanguage: organizationSchema.entries.defaultLanguage,
		defaultTimezone: organizationSchema.entries.defaultTimezone
	})
);
export type UpdateOrganization = v.InferInput<typeof updateOrganization>;

export const updateOrganizationZeroMutatorSchema = v.object({
	metadata: v.object({
		organizationId: helpers.uuid
	}),
	input: updateOrganization
});
export type UpdateOrganizationZeroMutatorSchema = v.InferOutput<
	typeof updateOrganizationZeroMutatorSchema
>;
  
export const updateOrganizationWhatsappSettings = v.partial(whatsappOrganizationSettingsSchema);
export type UpdateOrganizationWhatsappSettings = v.InferInput<
	typeof updateOrganizationWhatsappSettings
>;

export const organizationMutatorMetadata = v.object({
	organizationId: organizationSchema.entries.id
});

export const updateOrganizationMutatorSchema = v.object({
	input: updateOrganization,
	metadata: organizationMutatorMetadata
});

export const updateOrganizationWhatsappSettingsMutatorSchema = v.object({
	input: updateOrganizationWhatsappSettings,
	metadata: organizationMutatorMetadata
});
