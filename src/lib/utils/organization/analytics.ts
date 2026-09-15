import type { NewOrganizationFromWebsiteForm } from '$lib/schema/organization';
import { trackAnalyticsEvent, type AnalyticsEventData } from '$lib/utils/analytics';

export const organizationAnalyticsEventNames = {
	created: 'organization_created'
} as const;

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
