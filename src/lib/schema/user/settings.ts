import * as v from 'valibot';

export const userSettingsSchema = v.object({
	notifications: v.optional(
		v.object({
			digestEnabled: v.optional(v.boolean(), true),
			digestFrequency: v.optional(v.picklist(['daily', 'weekly']), 'weekly')
		})
	)
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
