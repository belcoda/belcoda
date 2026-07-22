import * as v from 'valibot';
import * as helpers from '$lib/schema/helpers';
import { templateMessageComponents } from '$lib/schema/whatsapp/template';
import {
	whatsappMessage as whatsappMessageObjectSchema,
	whatsappMessageActivityTypeSchema,
	type WhatsappMessageActivityType
} from '$lib/schema/whatsapp/message';

export const whatsappMessageStatus = v.picklist(['sent', 'delivered', 'read', 'failed', 'pending']);
export type WhatsappMessageStatus = v.InferOutput<typeof whatsappMessageStatus>;

export const whatsappMessageSchema = v.object({
	id: helpers.uuid,
	organizationId: helpers.uuid,
	whatsappThreadId: v.nullable(helpers.uuid),
	whatsappAccountId: v.nullable(helpers.uuid),
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
	...v.omit(whatsappMessageSchema, ['organizationId', 'externalId', 'whatsappAccountId']).entries,
	deliveredAt: v.nullable(helpers.dateToString),
	readAt: v.nullable(helpers.dateToString),
	createdAt: helpers.dateToString,
	updatedAt: helpers.dateToString
});

export const readWhatsappMessageRest = v.object({
	...v.omit(whatsappMessageSchema, ['organizationId', 'whatsappAccountId']).entries,
	createdAt: helpers.dateToString,
	updatedAt: helpers.dateToString
});
export type ReadWhatsappMessageRest = v.InferOutput<typeof readWhatsappMessageRest>;

export const readWhatsappMessageZero = v.object({
	...v.omit(whatsappMessageSchema, ['whatsappAccountId']).entries,
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

export const createWhatsappMessageSchemaZero = v.object({
	whatsappMessage: whatsappMessageObjectSchema
});
export type CreateWhatsappMessageSchemaZero = v.InferOutput<typeof createWhatsappMessageSchemaZero>;

import { whatsappTemplateMessageNodeData } from '$lib/schema/flow/index';
export const createWhatsappTemplateMessageSchemaZero = v.object({
	whatsappTemplateMessage: whatsappTemplateMessageNodeData
});
export type CreateWhatsappTemplateMessageSchemaZero = v.InferOutput<
	typeof createWhatsappTemplateMessageSchemaZero
>;

export const createWhatsAppMessageMutatorMetadata = v.object({
	whatsappMessageId: helpers.uuid,
	personId: helpers.uuid,
	organizationId: helpers.uuid,
	activityId: v.nullable(helpers.uuid),
	sentByUserId: v.nullable(helpers.uuid)
});
export type CreateWhatsAppMessageMutatorMetadata = v.InferOutput<
	typeof createWhatsAppMessageMutatorMetadata
>;
export const createWhatsAppMessageMutatorSchema = v.object({
	input: createWhatsappMessageSchemaZero,
	metadata: createWhatsAppMessageMutatorMetadata
});
export type CreateWhatsAppMessageMutatorSchema = v.InferOutput<
	typeof createWhatsAppMessageMutatorSchema
>;

export const createWhatsappTemplateMessageMutatorSchema = v.object({
	input: createWhatsappTemplateMessageSchemaZero,
	metadata: v.object({
		...createWhatsAppMessageMutatorMetadata.entries,
		templateComponents: templateMessageComponents,
		templateId: helpers.uuid
	})
});
export type CreateWhatsappTemplateMessageMutatorSchema = v.InferOutput<
	typeof createWhatsappTemplateMessageMutatorSchema
>;

export function isReactionSupportedMessageType(type: WhatsappMessageActivityType): boolean {
	return type === 'incoming_api_message' || type === 'outgoing_api_message';
}
