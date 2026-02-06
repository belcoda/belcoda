import {
	type WhatsappTemplateMessage,
	type WhatsappMessage,
	type WhatsappActions
} from '$lib/schema/whatsapp/message';
import type { LanguageCode } from '$lib/utils/language';
import type { YCloudWhatsappMessage } from '$lib/schema/whatsapp/ycloud/message';

export function convertWhatsAppTemplateMessageToApiFormat({
	templateMessage,
	actions,
	activityId,
	whatsappMessageId,
	from,
	to,
	name,
	language
}: {
	templateMessage: WhatsappTemplateMessage;
	actions: WhatsappActions;
	activityId: string;
	whatsappMessageId: string;
	from: string;
	to: string;
	name: string;
	language: LanguageCode;
}): YCloudWhatsappMessage {
	const components = [];
	if (templateMessage.header) {
		if (templateMessage.header.image_url) {
			components.push({
				type: 'header' as const,
				parameters: [
					{
						type: 'image' as const,
						image: {
							link: templateMessage.header.image_url
						}
					}
				]
			});
		}
		if (
			templateMessage.header.text &&
			templateMessage.header.parameters &&
			templateMessage.header.parameters.length > 0
		) {
			components.push({
				type: 'header' as const,
				parameters: templateMessage.header.parameters.map((param) => {
					return {
						type: 'text' as const,
						text: param.text
					};
				})
			});
		}
	}

	components.push({
		type: 'body' as const,
		parameters:
			templateMessage.body.parameters?.map((param) => {
				return {
					type: 'text' as const,
					text: param.text
				};
			}) || []
	});

	if (templateMessage.buttons && templateMessage.buttons.length > 0) {
		templateMessage.buttons.forEach((button, index) => {
			// Validate that parameters array exists and has at least one element
			if (!button.parameters || button.parameters.length === 0) {
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
						payload: button.parameters[0].payload
					}
				]
			});
		});
	}
	return {
		from: from,
		to: to,
		type: 'template',
		externalId: createExternalId(whatsappMessageId, templateMessage.id, activityId),
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

export function createExternalId(
	whatsappMessageId: string | null,
	templateMessageId: string,
	activityId: string
) {
	return `${whatsappMessageId ? whatsappMessageId : 'UNKNOWN'}:${templateMessageId}:${activityId}`;
}

export function extractExternalId(externalId: string): {
	whatsappMessageId: string | 'UNKNOWN';
	templateMessageId: string;
	activityId: string;
} {
	const [whatsappMessageId, templateMessageId, activityId] = externalId.split(':');
	if (!whatsappMessageId || !templateMessageId || !activityId) {
		throw new Error(`Invalid externalId: ${externalId}`);
	}
	return { whatsappMessageId, templateMessageId, activityId };
}

export function convertWhatsappMessageToApiFormat({
	whatsappMessage,
	activityId,
	whatsappMessageId,
	from,
	to
}: {
	whatsappMessage: WhatsappMessage;
	activityId: string;
	whatsappMessageId: string | null;
	from: string;
	to: string;
}): YCloudWhatsappMessage {
	const externalId = createExternalId(whatsappMessageId, whatsappMessage.id, activityId);
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
