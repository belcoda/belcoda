import pino from '$lib/pino';
const log = pino(import.meta.url);
import { env } from '$env/dynamic/private';

import {
	ycloudFlowResponseSchema,
	type WhatsappFlowInternal
} from '$lib/schema/whatsapp/flows/schema';
import { convertInternalToYCloudRequest } from '$lib/utils/whatsapp/flow_convert';

import * as v from 'valibot';

import { convertWhatsappMessageToApiFormat } from '$lib/server/utils/whatsapp/ycloud/convert_outbound';
import { type TemplateMessageComponents } from '$lib/schema/whatsapp/template';
import { whatsappTemplateStatus } from '$lib/schema/whatsapp/template/status';
import { renderValiError } from '$lib/schema/helpers';

export const whatsAppTemplateResponseSchema = v.object({
	wabaId: v.string(),
	name: v.string(),
	language: v.string(),
	category: v.string(),
	status: whatsappTemplateStatus,
	qualityRating: v.optional(v.picklist(['GREEN', 'YELLOW', 'RED', 'UNKNOWN'])),
	reason: v.optional(v.string())
});

async function sendToYCloud({
	endpoint,
	body,
	method
}: {
	endpoint: `/${string}`;
	body?: any;
	method: 'POST' | 'PUT' | 'DELETE' | 'GET' | 'PATCH';
}) {
	try {
		log.debug({ endpoint: `${env.YCLOUD_API_URL}${endpoint}`, body, method }, 'Sending to YCloud');
		const response = await fetch(`${env.YCLOUD_API_URL}${endpoint}`, {
			method,
			body: JSON.stringify(body),
			headers: {
				'Content-Type': 'application/json',
				'X-Api-Key': env.YCLOUD_API_KEY
			}
		});
		if (!response.ok) {
			const errorResponse = await response.json();
			log.error(
				{ error: errorResponse },
				`Error response from YCloud: ${endpoint} (${response.status})`
			);
			throw new Error(`Failed to send to YCloud: ${endpoint} (${response.status})`);
		}
		return response.json();
	} catch (error) {
		log.error({ error }, `Error sending to YCloud: ${endpoint}`);
		throw error;
	}
}

export async function sendWhatsappMessage(
	message: ReturnType<typeof convertWhatsappMessageToApiFormat>
) {
	const response = await sendToYCloud({
		endpoint: '/whatsapp/messages',
		body: message,
		method: 'POST'
	});
	log.debug({ response }, 'Sent message to YCloud');
	return response.id as string;
}

export async function sendFlowMessage({
	from,
	to,
	flowId,
	flowCta,
	headerText,
	bodyText,
	footerText
}: {
	from: string;
	to: string;
	flowId: string;
	flowCta: string;
	headerText?: string;
	bodyText?: string;
	footerText?: string;
}) {
	const message: any = {
		from,
		to,
		type: 'interactive',
		interactive: {
			type: 'flow',
			...(headerText && { header: { type: 'text', text: headerText } }),
			...(bodyText && { body: { text: bodyText } }),
			...(footerText && { footer: { text: footerText } }),
			action: {
				name: 'flow',
				parameters: {
					flow_message_version: '3',
					flow_id: flowId,
					flow_cta: flowCta,
					flow_action: 'navigate',
					flow_action_payload: {
						screen: 'registration'
					}
				}
			}
		}
	};

	const response = await sendToYCloud({
		endpoint: '/whatsapp/messages',
		body: message,
		method: 'POST'
	});

	log.info({ response, flowId, to }, 'Sent flow message to YCloud');
	return response.id;
}

export async function sendEmojiReaction({
	messageWamid,
	emoji,
	from,
	to
}: {
	messageWamid: string;
	emoji: string | null;
	from: string;
	to: string;
}) {
	const response = await sendToYCloud({
		endpoint: '/whatsapp/messages',
		method: 'POST',
		body: {
			type: 'reaction',
			reaction: {
				emoji,
				message_id: messageWamid
			},
			from,
			to
		}
	});
}

export async function registerWaba({
	phone_number_id,
	waba_id
}: {
	phone_number_id: string;
	waba_id: string;
}) {
	log.debug({ phone_number_id, waba_id }, 'Registering Waba');
	const response = await sendToYCloud({
		endpoint: `/whatsapp/businessAccounts/${waba_id}/tp/bind`,
		method: 'POST'
	});
	if (!response.paymentMethodAttached) {
		throw new Error('Payment method not attached');
	}
	log.debug({ response }, 'Waba registered');

	await sendToYCloud({
		endpoint: `/whatsapp/phoneNumbers/${waba_id}/${phone_number_id}/register`,
		method: 'POST'
	});
	log.debug({ response }, 'Phone number registered');
}

export async function deployFlow({
	flow,
	wabaId,
	publish = false,
	endpointUri
}: {
	flow: WhatsappFlowInternal;
	wabaId: string;
	publish?: boolean;
	endpointUri?: string;
}): Promise<{ flowId: string; success: boolean }> {
	if (env.MOCK_EXTERNAL_SERVICES === 'true') {
		const flowId = flow.metadata.ycloudFlowId?.trim() || flow.metadata.id;
		log.info({ flowId, wabaId, internalId: flow.metadata.id }, 'Mocking YCloud flow deployment');
		return { flowId, success: true };
	}

	const requestBody = convertInternalToYCloudRequest(flow, {
		wabaId,
		publish,
		endpointUri,
		categories: ['SIGN_UP']
	});

	log.debug({ flowId: flow.metadata.id, wabaId }, 'Deploying flow to YCloud');

	const response = await sendToYCloud({
		endpoint: '/whatsapp/flows',
		body: requestBody,
		method: 'POST'
	});

	const parsed = await v.parseAsync(ycloudFlowResponseSchema, response).catch((e) => {
		log.error(renderValiError(e), 'Error parsing flow response from YCloud');
		throw new Error('Invalid flow response from YCloud');
	});

	if (!parsed.id) {
		log.error({ response: parsed }, 'Flow creation response missing id');
		throw new Error('Flow creation response missing id');
	}

	log.info({ flowId: parsed.id, internalId: flow.metadata.id }, 'Flow deployed to YCloud');

	return {
		flowId: parsed.id,
		success: parsed.success
	};
}

export async function updateFlow({
	flow,
	wabaId,
	ycloudFlowId,
	publish = false,
	endpointUri
}: {
	flow: WhatsappFlowInternal;
	wabaId: string;
	ycloudFlowId: string;
	publish?: boolean;
	endpointUri?: string;
}): Promise<{ flowId: string; success: boolean }> {
	const requestBody = convertInternalToYCloudRequest(flow, {
		wabaId,
		publish,
		endpointUri,
		categories: ['SIGN_UP']
	});

	log.debug({ ycloudFlowId, internalId: flow.metadata.id, wabaId }, 'Updating flow on YCloud');

	// YCloud expects multipart/form-data with flowJson as a file
	const formData = new FormData();
	const flowJsonBlob = new Blob([requestBody.flowJson], { type: 'application/json' });
	formData.append('flowJson', flowJsonBlob, 'flow.json');

	const response = await fetch(`${env.YCLOUD_API_URL}/whatsapp/flows/${ycloudFlowId}/assets`, {
		method: 'PATCH',
		headers: {
			'X-API-Key': env.YCLOUD_API_KEY,
			accept: 'application/json'
			// Note: Content-Type is automatically set by fetch for FormData
		},
		body: formData
	});

	if (!response.ok) {
		const errorText = await response.text();
		log.error(
			{
				status: response.status,
				statusText: response.statusText,
				error: errorText,
				endpoint: `/whatsapp/flows/${ycloudFlowId}/assets`
			},
			`Error response from YCloud: /whatsapp/flows/${ycloudFlowId}/assets (${response.status})`
		);
		throw new Error(`YCloud API error: ${response.status} ${response.statusText}`);
	}

	const responseData = await response.json();

	const parsed = await v.parseAsync(ycloudFlowResponseSchema, responseData).catch((e) => {
		log.error(renderValiError(e), 'Error parsing flow update response from YCloud');
		throw new Error('Invalid flow update response from YCloud');
	});

	log.info({ flowId: ycloudFlowId, internalId: flow.metadata.id }, 'Flow updated on YCloud');

	return {
		flowId: ycloudFlowId,
		success: parsed.success
	};
}

export async function publishFlow({
	ycloudFlowId
}: {
	ycloudFlowId: string;
}): Promise<{ flowId: string; success: boolean }> {
	log.debug({ ycloudFlowId }, 'Publishing flow on YCloud');

	const response = await sendToYCloud({
		endpoint: `/whatsapp/flows/${ycloudFlowId}/publish`,
		method: 'POST'
	});

	const parsed = await v.parseAsync(ycloudFlowResponseSchema, response).catch((e) => {
		log.error(renderValiError(e), 'Error parsing flow publish response from YCloud');
		throw new Error('Invalid flow publish response from YCloud');
	});

	log.info({ flowId: ycloudFlowId }, 'Flow published on YCloud');

	return {
		flowId: ycloudFlowId,
		success: parsed.success
	};
}

export async function deprecateFlow({
	ycloudFlowId
}: {
	ycloudFlowId: string;
}): Promise<{ flowId: string; success: boolean }> {
	log.debug({ ycloudFlowId }, 'Deprecating flow on YCloud');

	const response = await sendToYCloud({
		endpoint: `/whatsapp/flows/${ycloudFlowId}/deprecate`,
		method: 'POST'
	});

	const parsed = await v.parseAsync(ycloudFlowResponseSchema, response).catch((e) => {
		log.error(renderValiError(e), 'Error parsing flow deprecate response from YCloud');
		throw new Error('Invalid flow deprecate response from YCloud');
	});

	log.info({ flowId: ycloudFlowId }, 'Flow deprecated on YCloud');

	return {
		flowId: ycloudFlowId,
		success: parsed.success
	};
}

// templates

export async function createWhatsappTemplate({
	wabaId,
	components,
	name,
	language,
	category = 'MARKETING'
}: {
	wabaId: string;
	components: TemplateMessageComponents;
	name: string;
	language: string;
	category?: 'MARKETING' | 'UTILITY' | 'AUTHENTICATION';
}) {
	const response = await sendToYCloud({
		endpoint: '/whatsapp/templates',
		body: {
			wabaId,
			name,
			language,
			category,
			components
		},
		method: 'POST'
	});

	const parsed = await v.parseAsync(whatsAppTemplateResponseSchema, response).catch((e) => {
		log.error(renderValiError(e), 'Error parsing response from YCloud');
		throw new Error('Invalid response from YCloud');
	});

	return {
		...parsed
	};
}

export async function updateWhatsappTemplate({
	wabaId,
	templateName,
	language,
	components
}: {
	wabaId: string;
	templateName: string;
	language: string;
	components: TemplateMessageComponents;
}) {
	const response = await sendToYCloud({
		endpoint: `/whatsapp/templates/${wabaId}/${templateName}/${language}`,
		body: components,
		method: 'PATCH'
	});
	const parsed = await v.parseAsync(whatsAppTemplateResponseSchema, response).catch((e) => {
		log.error(renderValiError(e), 'Error parsing response from YCloud');
		throw new Error('Invalid response from YCloud');
	});

	return {
		...parsed
	};
}

export async function getWhatsappTemplateStatus({
	wabaId,
	templateName,
	locale
}: {
	wabaId: string;
	templateName: string;
	locale: string;
}) {
	const response = await sendToYCloud({
		endpoint: `/whatsapp/templates/${wabaId}/${templateName}/${locale}`,
		method: 'GET'
	});
	const parsed = await v.parseAsync(whatsAppTemplateResponseSchema, response).catch((e) => {
		log.error(renderValiError(e), 'Error parsing response from YCloud');
		throw new Error('Invalid response from YCloud');
	});
	return parsed;
}

export async function checkWhatsappTemplateExists({
	wabaId,
	templateName,
	locale
}: {
	wabaId: string;
	templateName: string;
	locale: string;
}) {
	try {
		await sendToYCloud({
			endpoint: `/whatsapp/templates/${wabaId}/${templateName}/${locale}`,
			method: 'GET'
		});
		return true;
	} catch (error) {
		// Only treat 404 as "doesn't exist"; re-throw other errors
		if (error instanceof Error && error.message.includes('(404)')) {
			return false;
		}
		log.warn({ error }, 'Unexpected error checking template existence');
		throw error;
	}
}
