import * as v from 'valibot';

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

export const memberSettingsSchema = v.object({
	notifications: v.optional(memberNotificationSettingsSchema)
});

export type MemberSettingsSchema = v.InferOutput<typeof memberSettingsSchema>;

export function defaultMemberSettings(): MemberSettingsSchema {
	return {
		notifications: {
			digestEnabled: true,
			digestFrequency: 'weekly'
		}
	};
}

export function parseMemberSettings(value: unknown): MemberSettingsSchema | undefined {
	const result = v.safeParse(memberSettingsSchema, value);
	return result.success ? result.output : undefined;
}
