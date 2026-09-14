import { trackServerAnalyticsEvent } from '$lib/server/analytics';
import type { AnalyticsEventData } from '$lib/utils/analytics';

export async function sendAnalyticsEvent({
	name,
	data,
	url
}: {
	name: string;
	data?: AnalyticsEventData;
	url: string;
}) {
	await trackServerAnalyticsEvent(name, data, url);
}
