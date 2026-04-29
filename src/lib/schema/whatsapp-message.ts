import * as v from 'valibot';
import * as helpers from '$lib/schema/helpers';
import {
	whatsappMessage as whatsappMessageObjectSchema,
	whatsappMessageActivityTypeSchema,
	type WhatsappMessageActivityType
} from '$lib/schema/whatsapp/message';

export const whatsappMessageStatus = v.picklist(['delivered', 'read', 'failed', 'pending']);
export type WhatsappMessageStatus = v.InferOutput<typeof whatsappMessageStatus>;

export const whatsappMessageSchema = v.object({
	id: helpers.uuid,
	organizationId: helpers.uuid,
	whatsappThreadId: v.nullable(helpers.uuid),
	externalId: v.nullable(helpers.mediumString),
	wamidId: v.nullable(helpers.mediumString),
	type: whatsappMessageActivityTypeSchema,
	message: whatsappMessageObjectSchema,
	status: whatsappMessageStatus,
	statusMessage: v.nullable(helpers.mediumString),
	deliveredAt: v.nullable(helpers.date),
	readAt: v.nullable(helpers.date),
	userId: v.nullable(helpers.uuid),
	personId: helpers.uuid,
	createdAt: helpers.date,
	updatedAt: helpers.date
});
export type WhatsappMessageSchema = v.InferOutput<typeof whatsappMessageSchema>;

export const whatsappMessageApiSchema = v.object({
	...v.omit(whatsappMessageSchema, ['organizationId', 'externalId']).entries,
	deliveredAt: v.nullable(helpers.dateToString),
	readAt: v.nullable(helpers.dateToString),
	createdAt: helpers.dateToString,
	updatedAt: helpers.dateToString
});

export const readWhatsappMessageRest = v.object({
	...v.omit(whatsappMessageSchema, ['organizationId']).entries,
	createdAt: helpers.dateToString,
	updatedAt: helpers.dateToString
});
export type ReadWhatsappMessageRest = v.InferOutput<typeof readWhatsappMessageRest>;

export const readWhatsappMessageZero = v.object({
	...whatsappMessageSchema.entries,
	deliveredAt: v.nullable(helpers.unixTimestamp),
	readAt: v.nullable(helpers.unixTimestamp),
	createdAt: helpers.unixTimestamp,
	updatedAt: helpers.unixTimestamp
});
export type ReadWhatsappMessageZero = v.InferOutput<typeof readWhatsappMessageZero>;

export const emojiReactionMutatorSchemaZero = v.object({
	personId: helpers.uuid,
	organizationId: helpers.uuid,
	whatsappMessage: readWhatsappMessageZero,
	emoji: v.nullable(helpers.emoji)
});
export type EmojiReactionMutatorSchemaZero = v.InferOutput<typeof emojiReactionMutatorSchemaZero>;

export function isReactionSupportedMessageType(type: WhatsappMessageActivityType): boolean {
	return type === 'incoming_api_message' || type === 'outgoing_api_message';
}
