import * as v from 'valibot';
import * as helpers from '$lib/schema/helpers';

export const memberNotificationSettingsSchema = v.object({
	digestEnabled: v.boolean(),
	digestFrequency: v.picklist(['daily', 'weekly'])
});

export type MemberNotificationSettingsSchema = v.InferOutput<
	typeof memberNotificationSettingsSchema
>;

export const memberNotificationSettingsPatchSchema = v.partial(memberNotificationSettingsSchema);

export type MemberNotificationSettingsPatchSchema = v.InferOutput<
	typeof memberNotificationSettingsPatchSchema
>;

export const memberSidebarSettingsSchema = v.object({
	prioritizePeopleFavourites: v.boolean()
});

export type MemberSidebarSettingsSchema = v.InferOutput<typeof memberSidebarSettingsSchema>;

export function defaultMemberSidebarSettings(): MemberSidebarSettingsSchema {
	return {
		prioritizePeopleFavourites: true
	};
}

export const memberSettingsSchema = v.object({
	notifications: v.optional(memberNotificationSettingsSchema),
	sidebar: v.optional(memberSidebarSettingsSchema, defaultMemberSidebarSettings())
});

export type MemberSettingsSchema = v.InferOutput<typeof memberSettingsSchema>;

export function defaultMemberSettings(): MemberSettingsSchema {
	return {
		notifications: {
			digestEnabled: true,
			digestFrequency: 'weekly'
		},
		sidebar: defaultMemberSidebarSettings()
	};
}

export function parseMemberSettings(value: unknown): MemberSettingsSchema | undefined {
	const result = v.safeParse(memberSettingsSchema, value);
	return result.success ? result.output : undefined;
}

export const updatePeopleSidebarSettingsZeroMutatorSchema = v.object({
	metadata: v.object({
		organizationId: helpers.uuid
	}),
	input: memberSidebarSettingsSchema
});

export type UpdatePeopleSidebarSettingsZeroMutatorSchema = v.InferOutput<
	typeof updatePeopleSidebarSettingsZeroMutatorSchema
>;
