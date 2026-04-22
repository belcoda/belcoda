import { getQueue } from '$lib/server/queue';
import pino from '$lib/pino';
const log = pino(import.meta.url);
import { drizzle } from '$lib/server/db';
import { whatsappLog } from '$lib/schema/drizzle';
import { env } from '$env/dynamic/private';
import { v7 as uuidv7 } from 'uuid';
import { handleIncomingMessage } from '$lib/server/queue/handlers/whatsapp/incoming_message';
import { handleWhatsappTemplateReviewed } from '$lib/server/queue/handlers/whatsapp/template_reviewed';
const webhookSecret = env.YCLOUD_WEBHOOK_VERIFY_TOKEN;
const isMockMode = env.MOCK_EXTERNAL_SERVICES === 'true' && env.NODE_ENV !== 'production';

export async function POST({ request, url }) {
	const verifyToken = url.searchParams.get('verify');
	if (!isMockMode && verifyToken !== webhookSecret) {
		return new Response('Unauthorized', { status: 401 });
	}
	const body = await request.json();
	try {
		if (isMockMode) {
			switch (body.type) {
				case 'whatsapp.template.reviewed':
					await handleWhatsappTemplateReviewed(body);
					break;
				case 'whatsapp.inbound_message.received':
					await handleIncomingMessage(body);
					break;
				case 'whatsapp.message.updated':
					//TODO: implement message updated logic when needed
					break;
				default:
					log.warn({ type: body.type }, 'Unknown whatsapp webhook type');
			}
		} else {
			const queue = await getQueue();
			switch (body.type) {
				case 'whatsapp.template.reviewed':
					await queue.handleWhatsappTemplateReviewed(body);
					break;
				case 'whatsapp.inbound_message.received':
					await queue.handleIncomingMessage(body);
					break;
				case 'whatsapp.message.updated':
					//TODO: implement message updated logic when needed
					//await queue.handleWhatsappMessageUpdated(body);
					break;
				default:
					log.warn({ type: body.type }, 'Unknown whatsapp webhook type');
			}
		}
	} catch (error) {
		log.error(error, 'Error processing whatsapp webhook');
	} finally {
		await drizzle.insert(whatsappLog).values({
			id: uuidv7(),
			payload: body,
			createdAt: new Date()
		});
		return new Response('OK', { status: 200 }); //we don't want to block the webhook from being processed
	}
}
