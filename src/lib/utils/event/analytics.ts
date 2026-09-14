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

export type PublicEventLayout = 'default' | 'embed';

export const eventAnalyticsEventNames = {
	published: 'event_published',
	signupCompleted: 'event_signup_completed',
	declineCompleted: 'event_decline_completed',
	whatsAppHandoffOpened: 'event_whatsapp_handoff_opened'
} as const;

export type EventFormSignupCompletedAnalyticsData = {
	signup_channel: 'form';
	has_survey: boolean;
	layout: PublicEventLayout;
};

export type EventWhatsAppSignupCompletedAnalyticsData = {
	signup_channel: 'whatsapp';
	has_survey: boolean;
};

export type EventSignupCompletedAnalyticsData =
	| EventFormSignupCompletedAnalyticsData
	| EventWhatsAppSignupCompletedAnalyticsData;

export type EventDeclineCompletedAnalyticsData = {
	response_channel: 'form';
	has_survey: boolean;
	layout: PublicEventLayout;
};

export type EventWhatsAppHandoffAnalyticsData = {
	method: 'direct_link';
	layout: PublicEventLayout;
};

export function eventHasSurvey(event: EventPublishingAnalyticsSource): boolean {
	return Boolean(
		event.settings?.survey?.collections?.some((collection) => collection.questions?.length)
	);
}

export function getEventPublishingAnalytics(event: EventPublishingAnalyticsSource) {
	const hasLocation = Boolean(
		event.onlineLink ||
		event.addressLine1 ||
		event.addressLine2 ||
		event.locality ||
		event.region ||
		event.postcode
	);
	return {
		has_image: Boolean(event.featureImage),
		has_location: hasLocation,
		has_survey: eventHasSurvey(event)
	};
}

export function trackEventPublished(event: EventPublishingAnalyticsSource): void {
	trackAnalyticsEvent(eventAnalyticsEventNames.published, getEventPublishingAnalytics(event));
}

export function trackEventSignupCompleted(data: EventFormSignupCompletedAnalyticsData): void {
	trackAnalyticsEvent(eventAnalyticsEventNames.signupCompleted, data);
}

export function trackEventDeclineCompleted(data: EventDeclineCompletedAnalyticsData): void {
	trackAnalyticsEvent(eventAnalyticsEventNames.declineCompleted, data);
}

export function trackEventWhatsAppHandoffOpened(data: EventWhatsAppHandoffAnalyticsData): void {
	trackAnalyticsEvent(eventAnalyticsEventNames.whatsAppHandoffOpened, data);
}
