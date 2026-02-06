import * as v from 'valibot';
import { url } from '$lib/schema/helpers';

//when the message is a reply to a message, this is a reference to the message it is a reply to
export const context = v.object({
	from: v.string(), //phone number without leading plus
	id: v.string() //wamid.HBgNODr...
});

// Referral object (for click to WhatsApp Ads)
export const referral = v.object({
	source_url: url,
	source_type: v.string(), // e.g. 'ad'
	source_id: v.string(),
	headline: v.optional(v.string()),
	media_type: v.optional(v.string()),
	image_url: v.optional(url)
});

export const textMessage = v.object({
	type: v.literal('text'),
	text: v.object({
		body: v.string()
	})
});

export const imageMessage = v.object({
	type: v.literal('image'),
	image: v.object({
		link: url, //downloading this link requires an X-API-Key header with the YCloud token (must be done within 30 days)
		caption: v.optional(v.string()),
		id: v.optional(v.string()),
		sha256: v.optional(v.string()),
		mime_type: v.optional(v.string())
	})
});

export const videoMessage = v.object({
	type: v.literal('video'),
	video: v.object({
		link: url, //downloading this link requires an X-API-Key header with the YCloud token (must be done within 30 days)
		caption: v.optional(v.string()),
		id: v.optional(v.string()),
		sha256: v.optional(v.string()),
		mime_type: v.optional(v.string())
	})
});

export const audioMessage = v.object({
	type: v.literal('audio'),
	audio: v.object({
		link: url, //downloading this link requires an X-API-Key header with the YCloud token (must be done within 30 days)
		caption: v.optional(v.string()),
		id: v.optional(v.string()),
		sha256: v.optional(v.string()),
		mime_type: v.optional(v.string())
	})
});

export const documentMessage = v.object({
	type: v.literal('document'),
	document: v.object({
		link: url, //downloading this link requires an X-API-Key header with the YCloud token (must be done within 30 days)
		caption: v.optional(v.string()),
		filename: v.optional(v.string()),
		id: v.optional(v.string()),
		sha256: v.optional(v.string()),
		mime_type: v.optional(v.string())
	})
});

export const stickerMessage = v.object({
	type: v.literal('sticker'),
	sticker: v.object({
		link: url, //downloading this link requires an X-API-Key header with the YCloud token (must be done within 30 days)
		id: v.optional(v.string()),
		sha256: v.optional(v.string()),
		mime_type: v.optional(v.string())
	})
});

export const locationMessage = v.object({
	type: v.literal('location'),
	location: v.object({
		latitude: v.number(),
		longitude: v.number(),
		name: v.optional(v.string()),
		address: v.optional(v.string()),
		url: v.optional(url)
	})
});

export const reactionMessage = v.object({
	type: v.literal('reaction'),
	reaction: v.object({
		emoji: v.optional(v.string()),
		message_id: v.string()
	})
});

// Unsupported message
export const unsupportedMessage = v.object({
	type: v.literal('unsupported'),
	errors: v.array(
		v.object({
			code: v.string(),
			title: v.string()
		})
	)
});

// System message (e.g. user_changed_number)
export const systemMessage = v.object({
	type: v.literal('system'),
	system: v.object({
		body: v.string(),
		wa_id: v.string(),
		type: v.string() // e.g. 'user_changed_number'
	})
});

export const interactiveButtonReplyMessage = v.object({
	type: v.literal('interactive'),
	interactive: v.object({
		type: v.literal('button_reply'),
		button_reply: v.object({
			id: v.string(),
			title: v.string()
		})
	})
});

export const templateButtonReplyMessage = v.object({
	type: v.literal('button'),
	button: v.object({
		payload: v.string(),
		text: v.string()
	})
});

export const interactiveFlowReplyMessage = v.object({
	type: v.literal('interactive'),
	interactive: v.object({
		type: v.literal('nfm_reply'),
		nfm_reply: v.object({
			name: v.string(),
			body: v.optional(v.string()),
			response_json: v.string()
		})
	})
});
