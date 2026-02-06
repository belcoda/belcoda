import pino from '$lib/pino';
const log = pino(import.meta.url);
import {
	incomingMessageSchema,
	type IncomingMessage
} from '$lib/schema/whatsapp/ycloud/incoming_message';
import type { WhatsappMessage } from '$lib/schema/whatsapp/message';

type Output = {
	id: string;
	message: WhatsappMessage;
	from: string;
	to: string;
	wamid: string;
	waba: string;
	emojiReactions: {
		emoji: string;
		personId: string;
		phoneNumber: string;
		viaBelcoda: boolean;
		reactedAt: number;
	}[];
};

export async function convertIncomingWhatsAppMessage({
	inboundMessage,
	organizationId
}: {
	inboundMessage: IncomingMessage;
	organizationId: string;
}): Promise<Output> {
	// Combine text and caption if both exist, otherwise use whichever is available
	let text =
		inboundMessage.whatsappInboundMessage.type === 'text'
			? inboundMessage.whatsappInboundMessage.text?.body
			: null;
	const caption = extractCaption(inboundMessage);

	if (text && caption) {
		text = `${text}\n${caption}`;
	} else if (caption) {
		text = caption;
	}

	if (inboundMessage.whatsappInboundMessage.type === 'interactive') {
		const interactive = inboundMessage.whatsappInboundMessage.interactive;
		if (interactive.type === 'button_reply') {
			text = interactive.button_reply.title;
		}
	}

	if (inboundMessage.whatsappInboundMessage.type === 'button') {
		text = inboundMessage.whatsappInboundMessage.button.text;
	}

	const message: WhatsappMessage = {
		id: inboundMessage.whatsappInboundMessage.id,
		text: text ?? undefined,
		emojiReactions: [],
		image_url:
			inboundMessage.whatsappInboundMessage.type === 'image'
				? await uploadYCloudFile({
						mimeType: inboundMessage.whatsappInboundMessage.image.mime_type,
						downloadUrl: inboundMessage.whatsappInboundMessage.image.link,
						organizationId
					})
				: undefined,
		sticker_url:
			inboundMessage.whatsappInboundMessage.type === 'sticker'
				? await uploadYCloudFile({
						mimeType: inboundMessage.whatsappInboundMessage.sticker.mime_type,
						downloadUrl: inboundMessage.whatsappInboundMessage.sticker.link,
						organizationId
					})
				: undefined,
		video_url:
			inboundMessage.whatsappInboundMessage.type === 'video'
				? await uploadYCloudFile({
						mimeType: inboundMessage.whatsappInboundMessage.video.mime_type,
						downloadUrl: inboundMessage.whatsappInboundMessage.video.link,
						organizationId
					})
				: undefined,
		audio_url:
			inboundMessage.whatsappInboundMessage.type === 'audio'
				? await uploadYCloudFile({
						mimeType: inboundMessage.whatsappInboundMessage.audio.mime_type,
						downloadUrl: inboundMessage.whatsappInboundMessage.audio.link,
						organizationId
					})
				: undefined
	};

	return {
		id: inboundMessage.whatsappInboundMessage.id,
		from: inboundMessage.whatsappInboundMessage.from,
		to: inboundMessage.whatsappInboundMessage.to,
		wamid: inboundMessage.whatsappInboundMessage.wamid,
		waba: inboundMessage.whatsappInboundMessage.wabaId,
		message: message,
		emojiReactions: []
	};
}

function extractCaption(inboundMessage: IncomingMessage) {
	if (inboundMessage.whatsappInboundMessage.type === 'image') {
		return inboundMessage.whatsappInboundMessage.image?.caption;
	}
	if (inboundMessage.whatsappInboundMessage.type === 'video') {
		return inboundMessage.whatsappInboundMessage.video?.caption;
	}
	if (inboundMessage.whatsappInboundMessage.type === 'document') {
		return inboundMessage.whatsappInboundMessage.document?.caption;
	}
	return null;
}

import { getSignedPutUrl, uploadFileToS3 } from '$lib/server/utils/s3';
import { v4 as uuidv4 } from 'uuid';
import { env as publicEnv } from '$env/dynamic/public';
import { env } from '$env/dynamic/private';

async function uploadYCloudFile({
	mimeType = 'image/jpeg', //probably the most likely mime type??
	downloadUrl,
	organizationId
}: {
	mimeType: string | undefined;
	downloadUrl: string;
	organizationId: string;
}) {
	let fileExtension = mimeType.split('/')[1];
	if (fileExtension === 'vnd.openxmlformats-officedocument.wordprocessingml.document') {
		fileExtension = 'docx';
	}
	const fileKey = `org/${organizationId}/whatsapp/ycloud/${uuidv4()}.${fileExtension}`;
	const signedPutUrl = await getSignedPutUrl(
		publicEnv.PUBLIC_AWS_S3_SITE_UPLOADS_BUCKET_NAME,
		fileKey
	);
	return await uploadFileToS3(downloadUrl, signedPutUrl, {
		'X-Api-Key': env.YCLOUD_API_KEY
	});
}
