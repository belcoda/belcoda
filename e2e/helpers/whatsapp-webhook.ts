import type { APIRequestContext } from '@playwright/test';
import { BASE_URL } from './config';

function getE2EWabaId(): string {
	const wabaId =
		process.env.DEFAULT_WHATSAPP_BUSINESS_ACCOUNT_ID?.trim() ||
		process.env.SYSTEM_WABA_ID?.trim() ||
		'';

	if (!wabaId) {
		throw new Error(
			'Missing WhatsApp WABA id for E2E webhooks. Set SYSTEM_WABA_ID (or DEFAULT_WHATSAPP_BUSINESS_ACCOUNT_ID) in your env so it matches organization.settings.whatsApp.wabaId.'
		);
	}

	return wabaId;
}

export function getE2EDefaultWhatsAppNumber(): string {
	const number = process.env.PUBLIC_DEFAULT_WHATSAPP_NUMBER?.trim() || '';
	if (!number) {
		throw new Error(
			'Missing PUBLIC_DEFAULT_WHATSAPP_NUMBER in your env. This is the WhatsApp sender number for the E2E org.'
		);
	}
	return number;
}

export function buildWhatsAppInboundFlowReplyWebhook({
	wabaId = getE2EWabaId(),
	from,
	to,
	responseJson
}: {
	wabaId?: string;
	from: string;
	to: string;
	responseJson: Record<string, unknown>;
}) {
	const now = new Date().toISOString();
	const inboundId = crypto.randomUUID().replace(/-/g, '');
	const evtId = `evt_${inboundId}`;

	return {
		id: evtId,
		type: 'whatsapp.inbound_message.received' as const,
		apiVersion: 'v2' as const,
		createTime: now,
		whatsappInboundMessage: {
			id: inboundId,
			wamid: `wamid.${crypto.randomUUID().replace(/-/g, '')}`,
			wabaId,
			from,
			to,
			sendTime: now,
			type: 'interactive' as const,
			interactive: {
				type: 'nfm_reply' as const,
				nfm_reply: {
					name: 'flow',
					body: 'Sent',
					response_json: JSON.stringify(responseJson)
				}
			}
		}
	};
}

export async function postWhatsAppInboundWebhook(
	request: APIRequestContext,
	body: unknown
): Promise<{ status: number; text: string }> {
	const response = await request.post(`${BASE_URL}/webhooks/whatsapp`, {
		data: body,
		headers: { 'Content-Type': 'application/json' }
	});

	const text = await response.text();
	return { status: response.status(), text };
}
