import type { NewOrganizationFromWebsiteForm } from '$lib/schema/organization';
import type { UserRole } from '$lib/schema/user';
import type {
	OrganizationOnboardingSettingsSchema,
	OrganizationSettingsSchema
} from '$lib/schema/organization/settings';
import { trackAnalyticsEvent, type AnalyticsEventData } from '$lib/utils/analytics';

export const organizationAnalyticsEventNames = {
	created: 'organization_created',
	onboardingStepStarted: 'onboarding_step_started',
	onboardingStepCompleted: 'onboarding_step_completed',
	onboardingDeferred: 'onboarding_deferred',
	onboardingCompleted: 'onboarding_completed',
	onboardingInvitesSent: 'onboarding_invites_sent',
	onboardingWhatsAppConnectionCompleted: 'onboarding_whatsapp_connection_completed'
} as const;

export type OnboardingAnalyticsStep = 'profile' | 'team' | 'people' | 'invite' | 'whatsapp';
export type OnboardingAnalyticsEntryPoint = 'setup' | 'dashboard';

const trackedOnboardingSteps = [
	['profile', 'profile'],
	['team', 'team'],
	['invitations', 'invite'],
	['whatsappAccount', 'whatsapp']
] as const satisfies readonly (readonly [
	keyof OrganizationOnboardingSettingsSchema,
	OnboardingAnalyticsStep
])[];

const suggestedOnboardingSteps = [
	['profile', 'profile'],
	['team', 'team'],
	['people', 'people'],
	['invitations', 'invite'],
	['whatsappAccount', 'whatsapp']
] as const satisfies readonly (readonly [
	keyof OrganizationOnboardingSettingsSchema,
	OnboardingAnalyticsStep
])[];

export function getOrganizationCreatedAnalytics(
	organization: NewOrganizationFromWebsiteForm
): AnalyticsEventData {
	const discoverySource = organization.additionalDetails.howDidYouDiscover;

	return {
		has_website: Boolean(organization.website),
		has_logo: Boolean(organization.icon),
		...(discoverySource ? { discovery_source: discoverySource } : {})
	};
}

export function trackOrganizationCreated(organization: NewOrganizationFromWebsiteForm): void {
	trackAnalyticsEvent(
		organizationAnalyticsEventNames.created,
		getOrganizationCreatedAnalytics(organization)
	);
}

export function trackOnboardingStepStarted(
	step: OnboardingAnalyticsStep,
	entryPoint: OnboardingAnalyticsEntryPoint
): void {
	trackAnalyticsEvent(organizationAnalyticsEventNames.onboardingStepStarted, {
		step,
		entry_point: entryPoint
	});
}

export function getNewlyCompletedOnboardingSteps(
	previous: OrganizationOnboardingSettingsSchema | undefined,
	updates: Partial<OrganizationOnboardingSettingsSchema>
): OnboardingAnalyticsStep[] {
	if (!previous) return [];
	return trackedOnboardingSteps
		.filter(([setting]) => previous[setting] !== 'complete' && updates[setting] === 'complete')
		.map(([, step]) => step);
}

export function getOnboardingDeferredAnalytics(
	previous: OrganizationOnboardingSettingsSchema | undefined,
	updates: Partial<OrganizationOnboardingSettingsSchema>
): AnalyticsEventData | undefined {
	if (!previous || previous.initialSetup === 'skipped' || updates.initialSetup !== 'skipped')
		return;

	const nextState = { ...previous, ...updates };
	const nextStep = suggestedOnboardingSteps.find(
		([setting]) => !['complete', 'not_needed'].includes(nextState[setting] ?? 'pending')
	)?.[1];

	return {
		scope: 'onboarding',
		next_step: nextStep ?? 'none',
		required_steps_completed: previous?.profile === 'complete' ? 1 : 0
	};
}

export function getOnboardingCompletedAnalytics(
	previousSettings: OrganizationSettingsSchema,
	updates: Partial<OrganizationOnboardingSettingsSchema>
): AnalyticsEventData | undefined {
	const previousOnboarding = previousSettings.onboarding;
	if (!previousOnboarding) return;
	const nextOnboarding = { ...previousOnboarding, ...updates };
	if (
		previousOnboarding.initialSetup === 'complete' ||
		updates.initialSetup !== 'complete' ||
		nextOnboarding.profile !== 'complete'
	) {
		return;
	}

	return {
		completion_path: previousOnboarding.initialSetup === 'skipped' ? 'dashboard' : 'setup',
		invited_teammates: nextOnboarding.invitations === 'complete',
		whatsapp_connected: Boolean(
			previousSettings.whatsApp.wabaId && previousSettings.whatsApp.number
		)
	};
}

export function trackOnboardingInvitesSent(
	sentCount: number,
	failedCount: number,
	role: UserRole
): void {
	if (sentCount < 1) return;

	const countBand = sentCount === 1 ? 'one' : sentCount <= 5 ? 'two_to_five' : 'six_plus';
	trackAnalyticsEvent(organizationAnalyticsEventNames.onboardingInvitesSent, {
		count_band: countBand,
		role,
		partial_failure: failedCount > 0
	});
}
