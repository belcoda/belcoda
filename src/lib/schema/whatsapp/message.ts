import * as v from 'valibot';
import {
	url,
	uuid,
	shortString,
	longString,
	mediumString,
	count,
	emoji,
	isoPhoneNumber
} from '$lib/schema/helpers';

export const whatsappMessageActivityType = [
	'incoming_api_message',
	'outgoing_api_message',
	'incoming_group_message',
	'outgoing_group_message',
	'incoming_direct_message',
	'outgoing_direct_message'
] as const;
export const whatsappMessageActivityTypeSchema = v.picklist(whatsappMessageActivityType);
export type WhatsappMessageActivityType = v.InferOutput<typeof whatsappMessageActivityTypeSchema>;

const whatsappActions = {
	sendMessage: v.object({
		type: v.literal('sendWhatsAppMessage'),
		messageId: uuid
	}),
	eventSignup: v.object({
		type: v.literal('eventSignup'),
		eventId: uuid
	})
};

export const whatsappActionsSchema = v.variant('type', [
	whatsappActions.sendMessage,
	whatsappActions.eventSignup
]);

export const emojiReactionSchema = v.object({
	emoji: emoji,
	personId: v.optional(uuid),
	phoneNumber: v.optional(isoPhoneNumber),
	viaBelcoda: v.boolean(),
	reactedAt: count
});
export type EmojiReaction = v.InferOutput<typeof emojiReactionSchema>;

export type WhatsappActions = v.InferOutput<typeof whatsappActionsSchema>;

export const whatsappMessage = v.object({
	id: shortString, //is uuid for outgoing messages, and wamid for incoming messages
	headerText: v.optional(mediumString),
	text: v.optional(longString),
	image_url: v.optional(url),
	sticker_url: v.optional(url),
	video_url: v.optional(url),
	audio_url: v.optional(url),
	buttons: v.optional(
		v.array(
			v.object({
				text: v.pipe(
					v.string(),
					v.minLength(1, 'Button text must be at least 1 character'),
					v.maxLength(20, 'Button text must be less than 20 characters')
				),
				action: uuid
			})
		)
	),
	emojiReactions: v.optional(v.array(emojiReactionSchema), []),
	replyToMessageId: v.optional(uuid)
});
export type WhatsappMessage = v.InferOutput<typeof whatsappMessage>;

export const whatsappTemplateMessage = v.object({
	id: uuid,
	header: v.optional(
		v.object({
			text: v.optional(v.string()),
			image_url: v.optional(url),
			parameters: v.optional(v.array(v.object({ type: v.literal('text'), text: v.string() })))
		})
	),
	body: v.object({
		text: v.string(),
		parameters: v.optional(v.array(v.object({ type: v.literal('text'), text: v.string() })))
	}),
	buttons: v.optional(
		v.array(
			v.object({
				type: v.literal('button'),
				sub_type: v.literal('quick_reply'),
				index: v.number(),
				parameters: v.array(
					v.object({
						type: v.literal('payload'),
						payload: v.string() //format is uuid:uuid:uuid (whatsappMessage.id:message.id:action.id)
					})
				)
			})
		)
	)
});
export type WhatsappTemplateMessage = v.InferOutput<typeof whatsappTemplateMessage>;
