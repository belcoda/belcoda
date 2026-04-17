import { json, error } from '@sveltejs/kit';
import * as v from 'valibot';
import { isoPhoneNumber } from '$lib/schema/helpers';
import { getQueryContext } from '$lib/server/api/utils/auth/permissions';
import { db, drizzle } from '$lib/server/db';
import { builder } from '$lib/zero/schema';
import { whatsappThreadReadPermissions } from '$lib/zero/query/whatsapp_thread/permissions';
import { organization, whatsappTemplate } from '$lib/schema/drizzle';
import { and, eq } from 'drizzle-orm';
import {
	convertNodeToFullMessage,
	convertWhatsAppTemplateMessageToApiFormat,
	convertWhatsappMessageToApiFormat
} from '$lib/server/utils/whatsapp/ycloud/convert_outbound';
import { sendWhatsappMessage } from '$lib/server/utils/whatsapp/ycloud/ycloud_api';
import { env as publicEnv } from '$env/dynamic/public';
import type { Flow, MessageNodeData, TemplateMessageNode } from '$lib/schema/flow';
import pino from '$lib/pino';

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
		const ctx = await getQueryContext(event.locals.session.user.id);
		const thread = await db.run(
			builder.whatsappThread
				.where('id', '=', threadId)
				.where((expr) => whatsappThreadReadPermissions(expr, ctx))
				.where('deletedAt', 'IS', null)
				.one()
		);

		if (!thread) {
			return error(404, 'WhatsApp thread not found');
		}

		const org = await drizzle.query.organization.findFirst({
			where: eq(organization.id, thread.organizationId)
		});
		if (!org) {
			return error(404, 'Organization not found');
		}

		const fromNumber = org.settings.whatsApp.number || publicEnv.PUBLIC_DEFAULT_WHATSAPP_NUMBER;
		if (!fromNumber) {
			return error(400, 'Organization does not have a WhatsApp sender number configured');
		}

		const outboundNode = getFirstOutboundNode(thread.flow as Flow);
		const whatsappMessageId = crypto.randomUUID();

		if (outboundNode.type === 'templateMessage') {
			const template = await drizzle.query.whatsappTemplate.findFirst({
				where: and(
					eq(whatsappTemplate.id, outboundNode.data.templateId),
					eq(whatsappTemplate.organizationId, thread.organizationId)
				)
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
