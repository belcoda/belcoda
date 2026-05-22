// things to trigger daily:
import { _resetOrganizationFreeQuotas } from '$lib/server/api/data/organization';
import { json } from '@sveltejs/kit';
import pino from '$lib/pino';
import {
	DEFAULT_FREE_WHATSAPP_MESSAGE_CREDITS,
	DEFAULT_FREE_EMAIL_MESSAGE_CREDITS
} from '$lib/schema/helpers';
const log = pino(import.meta.url);
export async function POST() {
	try {
		//reset organization free quotas
		await _resetOrganizationFreeQuotas({
			freeWhatsAppCredits: DEFAULT_FREE_WHATSAPP_MESSAGE_CREDITS,
			freeEmailCredits: DEFAULT_FREE_EMAIL_MESSAGE_CREDITS
		});
		return json({ message: 'Daily cron job completed' });
	} catch (error) {
		log.error({ error }, 'Daily cron job failed');
		return json({ error: 'Daily cron job failed' }, { status: 500 });
	}
}
