import type { WhatsappTemplateMessageData } from '$lib/schema/flow';
import type { TemplateMessageComponents } from '$lib/schema/whatsapp/template';
import type { WhatsappMessage } from '$lib/schema/whatsapp/message';
import { v4 as uuidv4 } from 'uuid';

export function createMessageFromTemplateAndTemplateMessage({
	templateMessage,
	template,
	messageId,
	threadId
}: {
	templateMessage: WhatsappTemplateMessageData;
	template: TemplateMessageComponents;
	messageId: string;
	threadId?: string;
}) {
	let returnObject: WhatsappMessage = {
		id: messageId,
		emojiReactions: [],
		buttons: []
	};
	let templateHeader = template.find((t) => t.type === 'HEADER');
	let templateBody = template.find((t) => t.type === 'BODY');
	let templateButtons = template.find((t) => t.type === 'BUTTONS');
	if (templateHeader && templateMessage.header) {
		if (templateHeader.format === 'IMAGE') {
			returnObject.image_url = templateMessage.header.imageUrl || undefined;
		}
		if (templateHeader.format === 'TEXT' && templateMessage.header?.templateStrings) {
			const baseString = templateHeader.text;
			//replace the {{n}} in baseString with the values from templateMessage.header.templateStrings
			const replacedString = baseString.replace(/{{(\d+)}}/g, (match, p1) => {
				return templateMessage.header?.templateStrings?.[Number.parseInt(p1) - 1] || match;
			});
			returnObject.headerText = replacedString;
		}
	}
	if (templateBody && templateMessage.body && templateMessage.body?.templateStrings) {
		const baseString = templateBody.text;
		//replace the {{n}} in baseString with the values from templateMessage.body.templateStrings
		const replacedString = baseString.replace(/{{(\d+)}}/g, (match, p1) => {
			return templateMessage.body?.templateStrings?.[Number.parseInt(p1) - 1] || match;
		});
		returnObject.text = replacedString;
	}
	if (templateButtons && templateButtons.buttons && templateMessage.buttons) {
		returnObject.buttons = templateButtons.buttons.map((button, index) => {
			return {
				text: button.text,
				action: createButtonActionString({
					threadId: threadId || '[NO_THREAD]',
					nodeId: messageId,
					buttonId: templateMessage.buttons?.[index]?.id || uuidv4()
				})
			};
		});
	}
	return returnObject;
}

export function createButtonActionString({
	threadId,
	nodeId,
	buttonId
}: {
	threadId: string;
	nodeId: string;
	buttonId: string;
}) {
	return `${threadId}:${nodeId}:${buttonId}`;
}
