import * as v from 'valibot';
import * as helpers from '$lib/schema/helpers';

import {
	whatsappMessage as whatsappMessageObjectSchema,
	whatsappMessageActivityTypeSchema
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

export const whatsappMessageWebhook = v.object({
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
	createdAt: helpers.dateToTimestamp,
	updatedAt: helpers.dateToTimestamp
});
export type ReadWhatsappMessageZero = v.InferOutput<typeof readWhatsappMessageZero>;
