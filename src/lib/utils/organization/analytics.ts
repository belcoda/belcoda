import type { NewOrganizationFromWebsiteForm } from '$lib/schema/organization';
import { trackAnalyticsEvent, type AnalyticsEventData } from '$lib/utils/analytics';

export const organizationAnalyticsEventNames = {
	created: 'organization_created',
	onboardingStepStarted: 'onboarding_step_started'
} as const;

export type OnboardingAnalyticsStep = 'profile' | 'team' | 'people' | 'invite' | 'whatsapp';
export type OnboardingAnalyticsEntryPoint = 'setup' | 'dashboard';

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
