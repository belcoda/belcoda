import * as v from 'valibot';
import * as helpers from '$lib/schema/helpers';

export const whatsappPhoneNumberNameStatusSchema = v.picklist([
	'APPROVED',
	'AVAILABLE_WITHOUT_REVIEW',
	'DECLINED',
	'EXPIRED',
	'PENDING_REVIEW',
	'NONE'
]);

export const whatsappPhoneNumberProfileVerticalSchema = v.picklist([
	'OTHER',
	'AUTO',
	'BEAUTY',
	'APPAREL',
	'EDU',
	'ENTERTAIN',
	'EVENT_PLAN',
	'FINANCE',
	'GROCERY',
	'GOVT',
	'HOTEL',
	'HEALTH',
	'NONPROFIT',
	'PROF_SERVICES',
	'RETAIL',
	'TRAVEL',
	'RESTAURANT'
]);

export type WhatsappPhoneNumberProfileVertical = v.InferOutput<
	typeof whatsappPhoneNumberProfileVerticalSchema
>;

export const WHATSAPP_PROFILE_VERTICAL_OPTIONS: {
	value: WhatsappPhoneNumberProfileVertical;
	label: string;
}[] = [
	{ value: 'OTHER', label: 'Other' },
	{ value: 'AUTO', label: 'Automotive' },
	{ value: 'BEAUTY', label: 'Beauty, spa and salon' },
	{ value: 'APPAREL', label: 'Clothing and apparel' },
	{ value: 'EDU', label: 'Education' },
	{ value: 'ENTERTAIN', label: 'Entertainment' },
	{ value: 'EVENT_PLAN', label: 'Event planning and service' },
	{ value: 'FINANCE', label: 'Finance and banking' },
	{ value: 'GROCERY', label: 'Food and grocery' },
	{ value: 'GOVT', label: 'Public service' },
	{ value: 'HOTEL', label: 'Hotel and lodging' },
	{ value: 'HEALTH', label: 'Medical and health' },
	{ value: 'NONPROFIT', label: 'Non-profit' },
	{ value: 'PROF_SERVICES', label: 'Professional services' },
	{ value: 'RETAIL', label: 'Shopping and retail' },
	{ value: 'TRAVEL', label: 'Travel and transportation' },
	{ value: 'RESTAURANT', label: 'Restaurant' }
];

const profileWebsiteSchema = v.pipe(
	v.string(),
	v.maxLength(255, 'Maximum length is 255 characters'),
	v.url('Must be a valid URL including http:// or https://')
);

export const whatsappBusinessProfileSchema = v.object({
	about: v.optional(v.nullable(v.string())),
	address: v.optional(v.nullable(v.string())),
	description: v.optional(v.nullable(v.string())),
	email: v.optional(v.nullable(v.string())),
	profilePictureUrl: v.optional(v.nullable(v.string())),
	vertical: v.optional(v.nullable(whatsappPhoneNumberProfileVerticalSchema)),
	websites: v.optional(v.nullable(v.array(v.string()))),
	verifiedName: v.optional(v.nullable(v.string())),
	nameStatus: v.optional(v.nullable(whatsappPhoneNumberNameStatusSchema))
});

export type WhatsappBusinessProfile = v.InferOutput<typeof whatsappBusinessProfileSchema>;

export const whatsappBusinessAccountSummarySchema = v.object({
	businessStatus: v.optional(v.nullable(v.string())),
	businessName: v.optional(v.nullable(v.string())),
	businessVerificationStatus: v.optional(v.nullable(v.string())),
	whatsappBusinessManagerMessagingLimit: v.optional(v.nullable(v.string())),
	name: v.optional(v.nullable(v.string())),
	businessId: v.optional(v.nullable(v.string()))
});

export type WhatsappBusinessAccountSummary = v.InferOutput<
	typeof whatsappBusinessAccountSummarySchema
>;

export const whatsappProfileAndAccountResponseSchema = v.object({
	profile: whatsappBusinessProfileSchema,
	waba: whatsappBusinessAccountSummarySchema
});

export type WhatsappProfileAndAccountResponse = v.InferOutput<
	typeof whatsappProfileAndAccountResponseSchema
>;

export const updateWhatsappBusinessProfileInput = v.object({
	about: v.optional(v.pipe(v.string(), v.maxLength(139, 'Maximum length is 139 characters'))),
	address: v.optional(v.pipe(v.string(), v.maxLength(256, 'Maximum length is 256 characters'))),
	description: v.optional(
		v.pipe(v.string(), v.maxLength(512, 'Maximum length is 512 characters'))
	),
	email: v.optional(
		v.pipe(
			v.string(),
			v.maxLength(128, 'Maximum length is 128 characters'),
			v.email('Must be a valid email address')
		)
	),
	profilePictureUrl: v.optional(helpers.url),
	vertical: v.optional(whatsappPhoneNumberProfileVerticalSchema),
	websites: v.optional(v.pipe(v.array(profileWebsiteSchema), v.maxLength(2, 'Maximum of 2 websites')))
});

export type UpdateWhatsappBusinessProfileInput = v.InferOutput<
	typeof updateWhatsappBusinessProfileInput
>;

export function mockWhatsappBusinessProfile(): WhatsappBusinessProfile {
	return {
		about: 'Mock business — powered by Belcoda',
		address: '123 Mock Street',
		description: 'A sample WhatsApp Business profile used when external services are mocked.',
		email: 'contact@example.com',
		profilePictureUrl: 'https://picsum.photos/200',
		vertical: 'OTHER',
		websites: ['https://belcoda.com'],
		verifiedName: 'Mock Business',
		nameStatus: 'APPROVED'
	};
}

export function mockWhatsappBusinessAccountSummary(): WhatsappBusinessAccountSummary {
	return {
		businessStatus: 'APPROVED',
		businessName: 'Mock Business LLC',
		businessVerificationStatus: 'not_verified',
		whatsappBusinessManagerMessagingLimit: 'TIER_250',
		name: 'Mock Business',
		businessId: 'mock-business-id'
	};
}
