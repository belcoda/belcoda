import { type WhatsappMessage } from '$lib/schema/whatsapp/message';
import type { LanguageCode } from '$lib/utils/language';
import type { YCloudWhatsappMessage } from '$lib/schema/whatsapp/ycloud/message';
import { createButtonActionString } from '$lib/utils/whatsapp/template';
import type { WhatsappTemplateMessageData, WhatsappMessageData } from '$lib/schema/flow';

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
	recipient,
	name,
	language
}: {
	templateMessage: WhatsappTemplateMessageData;
	nodeId?: string | null;
	whatsappThreadId?: string | null;
	whatsappMessageId: string;
	from: string;
	to?: string;
	recipient?: string;
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
						payload: `${whatsappThreadId ?? 'UNKNOWN'}:${nodeId ?? 'UNKNOWN'}:${button.id}`
					}
				]
			});
		});
	}
	return {
		from: from,
		...(to ? { to } : {}),
		...(recipient ? { recipient } : {}),
		type: 'template',
		externalId: createExternalId({
			whatsappMessageId: whatsappMessageId ?? null,
			whatsappThreadId: whatsappThreadId ?? null,
			nodeId: nodeId ?? null
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

export function createExternalId({
	whatsappMessageId,
	whatsappThreadId,
	nodeId
}: {
	whatsappMessageId: string | null;
	whatsappThreadId: string | null;
	nodeId?: string | null;
}) {
	return `${whatsappThreadId || 'UNKNOWN'}:${nodeId || 'UNKNOWN'}:${whatsappMessageId || 'UNKNOWN'}`;
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
	to,
	recipient
}: {
	whatsappMessage: WhatsappMessage;
	nodeId?: string | null;
	whatsappThreadId?: string;
	whatsappMessageId: string | null;
	from: string;
	to?: string;
	recipient?: string;
}): YCloudWhatsappMessage {
	const externalId = createExternalId({
		whatsappMessageId: whatsappMessageId,
		whatsappThreadId: whatsappThreadId || '[NO_THREAD]',
		nodeId: nodeId || null
	});
	if (whatsappMessage.buttons && whatsappMessage.buttons.length > 0) {
		return generateInteractiveMessage({
			buttons: whatsappMessage.buttons,
			text: whatsappMessage.text,
			imageUrl: whatsappMessage.image_url,
			threadId: whatsappThreadId,
			messageId: whatsappMessageId,
			to: to,
			recipient,
			from: from,
			externalId: externalId
		});
	} else if (whatsappMessage.image_url) {
		return generateImageMessage({
			imageUrl: whatsappMessage.image_url,
			text: whatsappMessage.text,
			to: to,
			recipient,
			from: from,
			externalId: externalId
		});
	} else {
		return generateTextMessage({
			text: whatsappMessage.text || '[Error: Unknown message]',
			to: to,
			recipient,
			from: from,
			externalId: externalId
		});
	}
}

function generateImageMessage({
	imageUrl,
	text,
	to,
	recipient,
	from,
	externalId
}: {
	imageUrl: string;
	text?: string;
	to?: string;
	recipient?: string;
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
		...(to ? { to } : {}),
		...(recipient ? { recipient } : {}),
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
	recipient,
	from,
	externalId,
	threadId,
	messageId
}: {
	buttons: { text: string; action: string }[];
	text?: string;
	imageUrl?: string;
	to?: string;
	recipient?: string;
	from: string;
	externalId: string;
	threadId?: string;
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
		...(to ? { to } : {}),
		...(recipient ? { recipient } : {}),
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
								threadId: threadId || '[NO_THREAD]',
								nodeId: messageId || '[UNKNOWN_MESSAGE_ID]',
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
	recipient,
	from,
	externalId
}: {
	text: string;
	to?: string;
	recipient?: string;
	from: string;
	externalId: string;
}): YCloudWhatsappMessage {
	return {
		from: from,
		...(to ? { to } : {}),
		...(recipient ? { recipient } : {}),
		type: 'text',
		externalId: externalId,
		text: {
			body: text
		}
	};
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
