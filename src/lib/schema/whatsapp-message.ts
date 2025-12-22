import * as v from 'valibot';
import * as helpers from '$lib/schema/helpers';

import {
	whatsappMessage as whatsappMessageObjectSchema,
	whatsappMessageActivityTypeSchema
} from '$lib/schema/whatsapp/message';

export const whatsappMessageSchema = v.object({
	id: helpers.uuid,
	organizationId: helpers.uuid,
	whatsappThreadId: v.nullable(helpers.uuid),
	externalId: v.nullable(helpers.mediumString),
	wamidId: v.nullable(helpers.mediumString),
	type: whatsappMessageActivityTypeSchema,
	message: whatsappMessageObjectSchema,
	userId: v.nullable(helpers.uuid),
	personId: v.nullable(helpers.uuid),
	createdAt: helpers.date,
	updatedAt: helpers.date
});
export type WhatsappMessageSchema = v.InferOutput<typeof whatsappMessageSchema>;

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
