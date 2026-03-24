import { drizzle } from '$lib/server/db';
import { and, eq } from 'drizzle-orm';
import { whatsappThread, whatsappTemplate } from '$lib/schema/drizzle';

import { createMessageFromTemplateAndTemplateMessage } from '$lib/server/utils/whatsapp/ycloud/convert_outbound';
export async function getThreadMetadata({
	threadId,
	organizationId
}: {
	threadId: string;
	organizationId: string;
}) {
	const thread = await drizzle.query.whatsappThread.findFirst({
		where: and(eq(whatsappThread.id, threadId), eq(whatsappThread.organizationId, organizationId))
	});

	const templateMessageNode = thread?.flow.nodes.find((node) => node.type === 'templateMessage');
	if (!templateMessageNode) {
		throw new Error('Template message node not found');
	}
	const templateId = templateMessageNode.data.templateId;

	const template = await drizzle.query.whatsappTemplate.findFirst({
		where: and(
			eq(whatsappTemplate.id, templateId),
			eq(whatsappTemplate.organizationId, organizationId)
		)
	});
	if (!template) {
		throw new Error('Template not found');
	}

	const combinedTemplateMessage = createMessageFromTemplateAndTemplateMessage({
		templateMessage: templateMessageNode.data,
		template: template.components,
		messageId: templateMessageNode.id,
		threadId: threadId
	});
	const title = combinedTemplateMessage.headerText || combinedTemplateMessage.text;
	const description = combinedTemplateMessage.headerText ? combinedTemplateMessage.text : null;

	await drizzle
		.update(whatsappThread)
		.set({
			title,
			description
		})
		.where(eq(whatsappThread.id, threadId));
}
