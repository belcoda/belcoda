import { error, json, type RequestHandler } from '@sveltejs/kit';
import { getWebhookSecretByIdForOwner } from '$lib/server/api/data/webhook/webhook';
import pino from '$lib/pino';
import { isValiError } from 'valibot';

const log = pino(import.meta.url);

const secretNoCacheHeaders = {
	'Cache-Control': 'no-store, no-cache, must-revalidate',
	Pragma: 'no-cache',
	Expires: '0'
} as const;

export const GET: RequestHandler = async (event) => {
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
		if (secret === null) {
			return error(404, 'Webhook not found');
		}
		return json({ secret }, { headers: secretNoCacheHeaders });
	} catch (err) {
		if (isValiError(err)) {
			return error(400, 'Invalid webhook ID');
		}
		log.error({ err, webhookId }, 'Failed to load webhook secret for owner');
		return error(500, 'Failed to load webhook secret');
	}
};
