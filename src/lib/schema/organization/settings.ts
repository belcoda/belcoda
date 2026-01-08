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
	display: v.object({
		primaryColor: v.optional(v.nullable(helpers.hexColor), null),
		secondaryColor: v.optional(v.nullable(helpers.hexColor), null)
	})
});

export type OrganizationSettingsSchema = v.InferOutput<typeof organizationSettingsSchema>;

export const defaultDisplaySettings = {
	primaryColor: '#4f46e5',
	secondaryColor: '#10b981'
};

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
		display: {
			primaryColor: defaultDisplaySettings.primaryColor,
			secondaryColor: defaultDisplaySettings.secondaryColor
		}
	};
}
