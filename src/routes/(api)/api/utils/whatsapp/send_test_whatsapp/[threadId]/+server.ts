import { json, error } from '@sveltejs/kit';
import * as v from 'valibot';
import { isoPhoneNumber } from '$lib/schema/helpers';
import { getQueryContext } from '$lib/server/api/utils/auth/permissions';
import { getOrganization } from '$lib/server/api/data/organization';
import { getWhatsappThreadById } from '$lib/server/api/data/whatsapp/thread';
import {
	convertNodeToFullMessage,
	convertWhatsAppTemplateMessageToApiFormat,
	convertWhatsappMessageToApiFormat
} from '$lib/server/utils/whatsapp/ycloud/convert_outbound';
import { sendWhatsappMessage } from '$lib/server/utils/whatsapp/ycloud/ycloud_api';
import { env as publicEnv } from '$env/dynamic/public';
import type { Flow, MessageNodeData, TemplateMessageNode } from '$lib/schema/flow';
import pino from '$lib/pino';
import { getWhatsappTemplateById } from '$lib/server/api/data/whatsapp/template.js';

const log = pino(import.meta.url);

const requestSchema = v.object({
	phoneNumber: isoPhoneNumber
});

function getFirstOutboundNode(flow: Flow): TemplateMessageNode | MessageNodeData {
	const templateNode = flow.nodes.find((node) => node.type === 'templateMessage');
	if (templateNode) {
		return templateNode;
	}
	const messageNode = flow.nodes.find((node) => node.type === 'message');
	if (messageNode) {
		return messageNode;
	}
	throw new Error('No outbound WhatsApp message node found');
}

export async function POST(event) {
	if (!event.locals.session?.user?.id) {
		return error(401, 'Unauthorized');
	}

	const { threadId } = event.params;
	if (!threadId) {
		return error(400, 'WhatsApp thread ID is required');
	}

	let parsed: v.InferOutput<typeof requestSchema>;
	try {
		const body = await event.request.json();
		parsed = v.parse(requestSchema, body);
	} catch {
		return error(400, 'Invalid request body');
	}

	try {
		const userId = event.locals.session.user.id;
		const ctx = await getQueryContext(userId);
		const thread = await getWhatsappThreadById({ threadId, ctx });

		if (!thread) {
			return error(404, 'WhatsApp thread not found');
		}

		const org = await getOrganization({
			userId,
			organizationId: thread.organizationId
		}).catch(() => undefined);
		if (!org) {
			log.error({ userId, threadId }, 'Failed to get organization');
			return error(404, 'Organization not found');
		}

		const fromNumber = org.settings.whatsApp.number || publicEnv.PUBLIC_DEFAULT_WHATSAPP_NUMBER;
		if (!fromNumber) {
			return error(400, 'Organization does not have a WhatsApp sender number configured');
		}

		const outboundNode = getFirstOutboundNode(thread.flow as Flow);
		const whatsappMessageId = crypto.randomUUID();

		if (outboundNode.type === 'templateMessage') {
			const template = await getWhatsappTemplateById({
				templateId: outboundNode.data.templateId,
				organizationId: thread.organizationId
			});
			if (!template) {
				return error(404, 'WhatsApp template not found');
			}

			const payload = convertWhatsAppTemplateMessageToApiFormat({
				templateMessage: outboundNode.data,
				nodeId: outboundNode.id,
				whatsappThreadId: thread.id,
				whatsappMessageId,
				from: fromNumber,
				to: parsed.phoneNumber,
				name: template.name,
				language: template.locale
			});

			const ycloudMessageId = await sendWhatsappMessage(payload);
			log.debug({ threadId, phoneNumber: parsed.phoneNumber }, 'Test WhatsApp template sent');
			return json({ ycloudMessageId, phoneNumber: parsed.phoneNumber });
		}

		const fullMessage = convertNodeToFullMessage({
			messageNode: outboundNode.data,
			messageId: whatsappMessageId
		});

		const payload = convertWhatsappMessageToApiFormat({
			whatsappMessage: fullMessage,
			nodeId: outboundNode.id,
			whatsappThreadId: thread.id,
			whatsappMessageId,
			from: fromNumber,
			to: parsed.phoneNumber
		});

		const ycloudMessageId = await sendWhatsappMessage(payload);
		log.debug({ threadId, phoneNumber: parsed.phoneNumber }, 'Test WhatsApp message sent');
		return json({ ycloudMessageId, phoneNumber: parsed.phoneNumber });
	} catch (err) {
		log.error({ err, threadId }, 'Failed to send test WhatsApp');
		return error(500, 'Failed to send test WhatsApp');
	}
}
