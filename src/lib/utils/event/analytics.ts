import { trackAnalyticsEvent } from '$lib/utils/analytics';

export type EventPublishingAnalyticsSource = {
	featureImage?: string | null;
	onlineLink?: string | null;
	addressLine1?: string | null;
	addressLine2?: string | null;
	locality?: string | null;
	region?: string | null;
	postcode?: string | null;
	settings?: {
		survey?: {
			collections?: Array<{
				questions?: unknown[];
			}>;
		};
	} | null;
};

export function getEventPublishingAnalytics(event: EventPublishingAnalyticsSource) {
	const hasLocation = Boolean(
		event.onlineLink ||
		event.addressLine1 ||
		event.addressLine2 ||
		event.locality ||
		event.region ||
		event.postcode
	);
	const hasSurvey = Boolean(
		event.settings?.survey?.collections?.some((collection) => collection.questions?.length)
	);

	return {
		has_image: Boolean(event.featureImage),
		has_location: hasLocation,
		has_survey: hasSurvey
	};
}

export function trackEventPublished(event: EventPublishingAnalyticsSource): void {
	trackAnalyticsEvent('event_published', getEventPublishingAnalytics(event));
}
