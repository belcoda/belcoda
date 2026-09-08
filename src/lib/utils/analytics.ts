export type AnalyticsEventData = Record<string, string | number | boolean>;

declare global {
	interface Window {
		umami?: {
			track: (eventName: string, data?: AnalyticsEventData) => void;
		};
	}
}

export function trackAnalyticsEvent(eventName: string, data?: AnalyticsEventData): void {
	if (typeof window === 'undefined') return;

	try {
		window.umami?.track(eventName, data);
	} catch (error) {
		console.warn('Failed to record analytics event:', error);
	}
}
