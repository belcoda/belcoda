import * as v from 'valibot';
import * as helpers from '$lib/schema/helpers';

export const organizationSettingsSchema = v.object({
	whatsApp: v.object({
		wabaId: v.optional(v.nullable(helpers.shortString), null),
		number: v.optional(v.nullable(helpers.phoneNumber), null)
	}),
	email: v.object({
		systemFromIdentity: v.object({
			name: v.optional(v.nullable(helpers.shortString), null),
			replyTo: v.optional(v.nullable(helpers.email), null)
		}),
		defaultFromSignatureId: v.optional(v.nullable(helpers.uuid), null)
	}),
	theme: v.object({
		logo: v.optional(v.nullable(helpers.url), null),
		primaryColor: v.optional(v.nullable(v.string()), null),
		secondaryColor: v.optional(v.nullable(v.string()), null)
	})
});

export type OrganizationSettingsSchema = v.InferOutput<typeof organizationSettingsSchema>;

export function defaultOrganizationSettings(): OrganizationSettingsSchema {
	return {
		whatsApp: {
			wabaId: null,
			number: null
		},
		email: {
			systemFromIdentity: {
				name: null,
				replyTo: null
			},
			defaultFromSignatureId: null
		},
		theme: {
			logo: null,
			primaryColor: null,
			secondaryColor: null
		}
	};
}
