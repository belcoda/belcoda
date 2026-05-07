import type { APIRequestContext } from '@playwright/test';
import { BASE_URL, E2E_DUMMY_WHATSAPP_NUMBER, E2E_MOCK_WABA_ID } from './config';

export function getE2EDefaultWhatsAppNumber(): string {
	return E2E_DUMMY_WHATSAPP_NUMBER;
}

export function buildWhatsAppInboundFlowReplyWebhook({
	wabaId = E2E_MOCK_WABA_ID,
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
