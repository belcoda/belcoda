import * as v from 'valibot';
import * as helpers from '$lib/schema/helpers';
import {
	organizationSettingsSchema,
	defaultOrganizationSettings,
	whatsappOrganizationSettingsSchema
} from '$lib/schema/organization/settings';
import { organizationNameSchema, organizationSlugSchema } from '$lib/schema/organization/names';
import { userRole } from '$lib/schema/user';

export const organizationPlanSupported = 'supported' as const;
export const organizationPlanTypeArray = [organizationPlanSupported] as const;
export const organizationPlanType = v.picklist(organizationPlanTypeArray); //null == free
export type OrganizationPlanType = v.InferOutput<typeof organizationPlanType>;
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
	balance: helpers.count, //cached balance in usd hundreths of cents (real balance is calculated from the ledger)
	freeWhatsAppMessageCredits: v.nullable(helpers.count), //monthly allowance of free whatsapp messages
	freeEmailMessageCredits: v.nullable(helpers.count), //monthly allowance of free email messages
	resetFreeQuotasAfter: v.nullable(helpers.date), //date and time when the free quotas will be reset
	stripeCustomerId: v.nullable(helpers.shortString), //stripe customer id for the organization
	billingEmail: v.nullable(helpers.email), //email address for the organization's billing
	plan: v.nullable(organizationPlanType),
	createdAt: helpers.date,
	updatedAt: helpers.date
});
export type OrganizationSchema = v.InferOutput<typeof organizationSchema>;

export const organizationApiSchema = v.object({
	...v.omit(organizationSchema, ['id']).entries,
	createdAt: helpers.dateToString,
	updatedAt: helpers.dateToString
});

export const organizationMemberApiSchema = v.object({
	organizationId: helpers.uuid,
	userId: helpers.uuid,
	role: userRole
});

export const readOrganizationRest = v.object({
	...organizationSchema.entries,
	createdAt: helpers.dateToString,
	updatedAt: helpers.dateToString
});
export type ReadOrganizationRest = v.InferOutput<typeof readOrganizationRest>;

export const readOrganizationZero = v.omit(
	v.object({
		...organizationSchema.entries,
		createdAt: helpers.dateToTimestamp,
		updatedAt: helpers.dateToTimestamp
	}),
	['stripeCustomerId', 'billingEmail', 'plan']
);
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

export const newOrganizationFromWebsiteForm = v.object({
	name: organizationSchema.entries.name,
	slug: organizationSchema.entries.slug,
	icon: v.optional(organizationSchema.entries.icon, null),
	website: v.optional(helpers.domainNameOrUrl),
	additionalDetails: v.object({
		howDidYouDiscover: v.picklist([
			'search-engine',
			'referral',
			'training-conference',
			'resources',
			'social-media'
		])
	})
});
export type NewOrganizationFromWebsiteForm = v.InferOutput<typeof newOrganizationFromWebsiteForm>;

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
export type UpdateOrganizationMutatorSchema = v.InferOutput<typeof updateOrganizationMutatorSchema>;

export const updateOrganizationWhatsappSettingsMutatorSchema = v.object({
	input: updateOrganizationWhatsappSettings,
	metadata: organizationMutatorMetadata
});
export type UpdateOrganizationWhatsappSettingsMutatorSchema = v.InferOutput<
	typeof updateOrganizationWhatsappSettingsMutatorSchema
>;
