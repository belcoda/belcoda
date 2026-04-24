import { error, json } from '@sveltejs/kit';
import { getWebhookSecretByIdForOwner } from '$lib/server/api/data/webhook/webhook';
import pino from '$lib/pino';
const log = pino(import.meta.url);

export async function GET(event) {
	const userId = event.locals.session?.user.id;
	if (!userId) {
		return error(401, 'Unauthorized');
	}

	const { webhookId } = event.params;
	if (!webhookId) {
		return error(400, 'Webhook ID is required');
	}

	try {
		const secret = await getWebhookSecretByIdForOwner({ userId, webhookId });
		return json({ secret });
	} catch (err) {
		log.error({ err, webhookId }, 'Failed to load webhook secret for owner');
		return error(500, 'Failed to load webhook secret');
	}
}
