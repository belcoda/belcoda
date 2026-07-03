import * as v from 'valibot';

export const digestFrequency = v.picklist(['daily', 'weekly']);
export type DigestFrequency = v.InferOutput<typeof digestFrequency>;

export const userNotificationSettings = v.object({
	digestEnabled: v.optional(v.boolean(), true),
	digestFrequency: v.optional(digestFrequency, 'weekly')
});
export type UserNotificationSettings = v.InferOutput<typeof userNotificationSettings>;

export const userSettingsSchema = v.object({
	notifications: v.optional(userNotificationSettings, {})
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
