import { env } from '$env/dynamic/public';
import pino from '$lib/pino';
import type { AnalyticsEventData } from '$lib/utils/analytics';

const log = pino(import.meta.url);
const UMAMI_EVENT_ENDPOINT = 'https://gateway.umami.is/api/send';

export async function trackServerAnalyticsEvent(
	eventName: string,
	data?: AnalyticsEventData
): Promise<void> {
	const websiteId = env.PUBLIC_UMAMI_WEBSITE_ID;
	if (!websiteId) {
		log.debug({ eventName }, 'Skipping server analytics event because no Umami website ID is set');
		return;
	}

	const hostname = env.PUBLIC_ROOT_DOMAIN?.split(':')[0] || 'localhost';

	try {
		const response = await fetch(UMAMI_EVENT_ENDPOINT, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'User-Agent': 'Belcoda server analytics',
				'x-umami-website-id': websiteId,
				'x-umami-hostname': hostname
			},
			body: JSON.stringify({
				type: 'event',
				payload: {
					website: websiteId,
					hostname,
					url: '/petitions/whatsapp-signature',
					name: eventName,
					data
				}
			}),
			signal: AbortSignal.timeout(5_000)
		});

		if (!response.ok) {
			log.warn({ eventName, status: response.status }, 'Umami rejected a server analytics event');
		}
	} catch (error) {
		log.warn({ error, eventName }, 'Failed to record server analytics event');
	}
}
