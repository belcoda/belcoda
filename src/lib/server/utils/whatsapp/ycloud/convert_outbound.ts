import {
	type WhatsappTemplateMessage,
	type WhatsappMessage,
	type WhatsappActions
} from '$lib/schema/whatsapp/message';
import type { TemplateMessageComponents } from '$lib/schema/whatsapp/template';
import type { LanguageCode } from '$lib/utils/language';
import type { YCloudWhatsappMessage } from '$lib/schema/whatsapp/ycloud/message';
import type { WhatsappTemplateMessageData, WhatsappMessageData } from '$lib/schema/flow';
import { v4 as uuidv4 } from 'uuid';

export function convertNodeToFullMessage({
	messageNode,
	messageId
}: {
	messageNode: WhatsappMessageData;
	messageId: string;
}): WhatsappMessage {
	return {
		id: messageId,
		text: messageNode.text,
		image_url: messageNode.imageUrl || undefined,
		buttons: messageNode.buttons.map((button) => ({
			text: button.label,
			action: button.id
		})),
		emojiReactions: [],
		replyToMessageId: undefined
	};
}

export function convertWhatsAppTemplateMessageToApiFormat({
	templateMessage,
	nodeId,
	whatsappThreadId,
	whatsappMessageId,
	from,
	to,
	name,
	language
}: {
	templateMessage: WhatsappTemplateMessageData;
	nodeId: string;
	whatsappThreadId: string;
	whatsappMessageId: string;
	from: string;
	to: string;
	name: string;
	language: LanguageCode;
}): YCloudWhatsappMessage {
	const components = [];
	if (templateMessage.header) {
		if (templateMessage.header.imageUrl) {
			components.push({
				type: 'header' as const,
				parameters: [
					{
						type: 'image' as const,
						image: {
							link: templateMessage.header.imageUrl
						}
					}
				]
			});
		}
		if (
			templateMessage.header.templateStrings &&
			templateMessage.header.templateStrings.length > 0
		) {
			components.push({
				type: 'header' as const,
				parameters: templateMessage.header.templateStrings.map((param) => {
					return {
						type: 'text' as const,
						text: param
					};
				})
			});
		}
	}

	components.push({
		type: 'body' as const,
		parameters:
			templateMessage.body?.templateStrings?.map((param) => {
				return {
					type: 'text' as const,
					text: param
				};
			}) || []
	});

	if (templateMessage.buttons && templateMessage.buttons.length > 0) {
		templateMessage.buttons.forEach((button, index) => {
			// Validate that parameters array exists and has at least one element
			if (!button || !button.id) {
				throw new Error(
					`Button at index ${index} has no parameters array or empty parameters array`
				);
			}

			components.push({
				type: 'button' as const,
				sub_type: 'quick_reply' as const,
				index: index,
				parameters: [
					{
						type: 'payload' as const,
						payload: `${whatsappThreadId}:${nodeId}:${button.id}`
					}
				]
			});
		});
	}
	return {
		from: from,
		to: to,
		type: 'template',
		externalId: createExternalId({
			whatsappMessageId: whatsappMessageId,
			whatsappThreadId: whatsappThreadId,
			nodeId: nodeId
		}),
		template: {
			name: name,
			language: {
				code: language,
				policy: 'deterministic'
			},
			components: components
		}
	};
}

export function createMessageFromTemplateAndTemplateMessage({
	templateMessage,
	template,
	messageId,
	threadId
}: {
	templateMessage: WhatsappTemplateMessageData;
	template: TemplateMessageComponents;
	messageId: string;
	threadId: string;
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
				return templateMessage.header?.templateStrings?.[parseInt(p1) - 1] || match;
			});
			returnObject.headerText = replacedString;
		}
	}
	if (templateBody && templateMessage.body && templateMessage.body?.templateStrings) {
		const baseString = templateBody.text;
		//replace the {{n}} in baseString with the values from templateMessage.body.templateStrings
		const replacedString = baseString.replace(/{{(\d+)}}/g, (match, p1) => {
			return templateMessage.body?.templateStrings?.[parseInt(p1) - 1] || match;
		});
		returnObject.text = replacedString;
	}
	if (templateButtons && templateButtons.buttons && templateMessage.buttons) {
		returnObject.buttons = templateButtons.buttons.map((button, index) => {
			return {
				text: button.text,
				action: createButtonActionString({
					threadId: threadId,
					nodeId: messageId,
					buttonId: templateMessage.buttons?.[index]?.id || uuidv4()
				})
			};
		});
	}
	return returnObject;
}

export function createExternalId({
	whatsappMessageId,
	whatsappThreadId,
	nodeId
}: {
	whatsappMessageId: string | null;
	whatsappThreadId: string;
	nodeId: string | null;
}) {
	return `${whatsappThreadId}:${nodeId || 'UNKNOWN'}:${whatsappMessageId || 'UNKNOWN'}`;
}

export function extractExternalId(externalId: string): {
	whatsappMessageId: string | 'UNKNOWN';
	whatsappThreadId: string;
	nodeId: string | 'UNKNOWN';
} {
	const [whatsappThreadId, nodeId, whatsappMessageId] = externalId.split(':');
	if (!whatsappThreadId || !nodeId || !whatsappMessageId) {
		throw new Error(`Invalid externalId: ${externalId}`);
	}
	return { whatsappThreadId, nodeId, whatsappMessageId };
}

export function convertWhatsappMessageToApiFormat({
	whatsappMessage,
	nodeId,
	whatsappThreadId,
	whatsappMessageId,
	from,
	to
}: {
	whatsappMessage: WhatsappMessage;
	nodeId: string | null;
	whatsappThreadId: string;
	whatsappMessageId: string | null;
	from: string;
	to: string;
}): YCloudWhatsappMessage {
	const externalId = createExternalId({
		whatsappMessageId: whatsappMessageId,
		whatsappThreadId: whatsappThreadId,
		nodeId: nodeId
	});
	if (whatsappMessage.buttons) {
		return generateInteractiveMessage({
			buttons: whatsappMessage.buttons,
			text: whatsappMessage.text,
			imageUrl: whatsappMessage.image_url,
			threadId: whatsappThreadId,
			messageId: whatsappMessageId,
			to: to,
			from: from,
			externalId: externalId
		});
	} else if (whatsappMessage.image_url) {
		return generateImageMessage({
			imageUrl: whatsappMessage.image_url,
			text: whatsappMessage.text,
			to: to,
			from: from,
			externalId: externalId
		});
	} else {
		return generateTextMessage({
			text: whatsappMessage.text || '[Error: Unknown message]',
			to: to,
			from: from,
			externalId: externalId
		});
	}
}

function generateImageMessage({
	imageUrl,
	text,
	to,
	from,
	externalId
}: {
	imageUrl: string;
	text?: string;
	to: string;
	from: string;
	externalId: string;
}): YCloudWhatsappMessage {
	const image = text
		? {
				link: imageUrl,
				caption: text
			}
		: {
				link: imageUrl
			};
	return {
		from: from,
		to: to,
		type: 'image',
		externalId: externalId,
		image: image
	};
}

function generateInteractiveMessage({
	buttons,
	text,
	imageUrl,
	to,
	from,
	externalId,
	threadId,
	messageId
}: {
	buttons: { text: string; action: string }[];
	text?: string;
	imageUrl?: string;
	to: string;
	from: string;
	externalId: string;
	threadId: string;
	messageId: string | null;
}): YCloudWhatsappMessage {
	const header = imageUrl
		? {
				type: 'image' as const,
				image: {
					link: imageUrl
				}
			}
		: undefined;
	return {
		from: from,
		to: to,
		type: 'interactive',
		externalId: externalId,
		interactive: {
			type: 'button',
			...(header ? { header } : {}),
			body: text ? { text } : undefined,
			action: {
				buttons: buttons.map((button) => {
					return {
						type: 'reply',
						reply: {
							title: button.text,
							id: createButtonActionString({
								threadId: threadId,
								nodeId: messageId || '[UNKNWON_MESSAGE_ID]',
								buttonId: button.action
							})
						}
					};
				})
			}
		}
	};
}

function generateTextMessage({
	text,
	to,
	from,
	externalId
}: {
	text: string;
	to: string;
	from: string;
	externalId: string;
}): YCloudWhatsappMessage {
	return {
		from: from,
		to: to,
		type: 'text',
		externalId: externalId,
		text: {
			body: text
		}
	};
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

export function extractButtonActionString(actionString: string): {
	threadId: string;
	nodeId: string;
	buttonId: string;
} {
	const [threadId, nodeId, buttonId] = actionString.split(':');
	if (!threadId || !nodeId || !buttonId) {
		throw new Error(`Invalid actionString: ${actionString}`);
	}
	return { threadId, nodeId, buttonId };
}
