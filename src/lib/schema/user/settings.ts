import * as v from 'valibot';

export const userNotificationSettingsSchema = v.object({
	digestEnabled: v.boolean(),
	digestFrequency: v.picklist(['daily', 'weekly'])
});

export type UserNotificationSettingsSchema = v.InferOutput<typeof userNotificationSettingsSchema>;

export const userNotificationSettingsPatchSchema = v.partial(userNotificationSettingsSchema);

export type UserNotificationSettingsPatchSchema = v.InferOutput<
	typeof userNotificationSettingsPatchSchema
>;

export const userSettingsSchema = v.object({
	notifications: v.optional(userNotificationSettingsSchema)
});

export type UserSettingsSchema = v.InferOutput<typeof userSettingsSchema>;

export function defaultUserSettings(): UserSettingsSchema {
	return {
		notifications: {
			digestEnabled: true,
			digestFrequency: 'weekly'
		}
	};
}

export function parseUserSettings(value: unknown): UserSettingsSchema | undefined {
	const result = v.safeParse(userSettingsSchema, value);
	return result.success ? result.output : undefined;
}
