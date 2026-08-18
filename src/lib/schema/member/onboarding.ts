import type {
	MemberOnboardingSettingsPatchSchema,
	MemberOnboardingSettingsSchema
} from '$lib/schema/member/settings';

export const inferredMemberOnboardingSteps = [
	'language',
	'whatsappAccount',
	'event',
	'publishEvent'
] as const;

export type InferredMemberOnboardingStep = (typeof inferredMemberOnboardingSteps)[number];

export type MemberOnboardingInferenceFacts = Record<InferredMemberOnboardingStep, boolean>;

export function inferMemberOnboardingPatch({
	settings,
	facts
}: {
	settings: MemberOnboardingSettingsSchema;
	facts: MemberOnboardingInferenceFacts;
}): MemberOnboardingSettingsPatchSchema {
	const patch: MemberOnboardingSettingsPatchSchema = {};

	for (const step of inferredMemberOnboardingSteps) {
		if (facts[step] && settings[step] === 'pending') {
			patch[step] = 'complete';
		}
	}

	return patch;
}
