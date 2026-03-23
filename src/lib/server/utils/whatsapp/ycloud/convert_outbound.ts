import {
	type WhatsappTemplateMessage,
	type WhatsappMessage,
	type WhatsappActions
} from '$lib/schema/whatsapp/message';
import type { LanguageCode } from '$lib/utils/language';
import type { YCloudWhatsappMessage } from '$lib/schema/whatsapp/ycloud/message';
import type { WhatsappTemplateMessageNodeData } from '$lib/schema/flow';

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
	templateMessage: WhatsappTemplateMessageNodeData;
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
	externalId
}: {
	buttons: { text: string; action: string }[];
	text?: string;
	imageUrl?: string;
	to: string;
	from: string;
	externalId: string;
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
							id: button.action
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
