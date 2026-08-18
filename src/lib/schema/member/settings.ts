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

export const memberOnboardingStatusSchema = v.picklist(['pending', 'skipped', 'complete']);

export type MemberOnboardingStatusSchema = v.InferOutput<typeof memberOnboardingStatusSchema>;

export const memberOnboardingSettingsSchema = v.object({
	language: memberOnboardingStatusSchema,
	whatsappAccount: memberOnboardingStatusSchema,
	event: memberOnboardingStatusSchema,
	publishEvent: memberOnboardingStatusSchema,
	other: memberOnboardingStatusSchema,
	advanced: memberOnboardingStatusSchema
});

export type MemberOnboardingSettingsSchema = v.InferOutput<typeof memberOnboardingSettingsSchema>;

export const memberOnboardingSettingsPatchSchema = v.partial(memberOnboardingSettingsSchema);

export type MemberOnboardingSettingsPatchSchema = v.InferOutput<
	typeof memberOnboardingSettingsPatchSchema
>;

export const memberSettingsSchema = v.object({
	notifications: v.optional(memberNotificationSettingsSchema),
	onboarding: v.optional(memberOnboardingSettingsSchema)
});

export type MemberSettingsSchema = v.InferOutput<typeof memberSettingsSchema>;

export function defaultMemberOnboardingSettings(
	status: MemberOnboardingStatusSchema = 'pending'
): MemberOnboardingSettingsSchema {
	return {
		language: status,
		whatsappAccount: status,
		event: status,
		publishEvent: status,
		other: status,
		advanced: status
	};
}

export function memberOnboardingIsComplete(settings: MemberOnboardingSettingsSchema): boolean {
	return Object.values(settings).every((status) => status !== 'pending');
}

export function defaultMemberSettings({
	onboardingStatus = 'complete'
}: {
	onboardingStatus?: MemberOnboardingStatusSchema;
} = {}): MemberSettingsSchema {
	return {
		notifications: {
			digestEnabled: true,
			digestFrequency: 'weekly'
		},
		onboarding: defaultMemberOnboardingSettings(onboardingStatus)
	};
}

export function parseMemberSettings(value: unknown): MemberSettingsSchema | undefined {
	const result = v.safeParse(memberSettingsSchema, value);
	return result.success ? result.output : undefined;
}
