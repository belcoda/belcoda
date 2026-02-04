import * as v from 'valibot';
import * as helpers from '$lib/schema/helpers';

import { whatsappMessage as whatsappMessageSchema } from '$lib/schema/whatsapp/message';
import { filterGroup } from '$lib/schema/person/filter';
import { whatsappTemplateMessage as whatsappTemplateMessageSchema } from '$lib/schema/whatsapp/message';
import { whatsappMessageActionsSchema } from '$lib/schema/whatsapp/actions';

export const whatsappThreadSchema = v.object({
	id: helpers.uuid,
	organizationId: helpers.uuid,
	teamId: v.nullable(helpers.uuid),
	recipients: filterGroup,
	templateId: helpers.uuid,
	templateMessage: whatsappTemplateMessageSchema,
	messages: v.array(whatsappMessageSchema),
	actions: v.record(v.string(), v.array(whatsappMessageActionsSchema)),
	sentBy: v.nullable(helpers.uuid),
	startedAt: v.nullable(helpers.date),
	completedAt: v.nullable(helpers.date),
	estimatedRecipientCount: helpers.count,
	successfulRecipientCount: helpers.count,
	failedRecipientCount: helpers.count,
	estimatedCost: v.nullable(helpers.integer),
	totalCost: v.nullable(helpers.integer),
	createdAt: helpers.date,
	updatedAt: helpers.date,
	deletedAt: v.nullable(helpers.date)
});
export type WhatsappThreadSchema = v.InferOutput<typeof whatsappThreadSchema>;

export const readWhatsappThreadRest = v.object({
	...v.omit(whatsappThreadSchema, ['organizationId']).entries,
	startedAt: v.nullable(helpers.dateToString),
	completedAt: v.nullable(helpers.dateToString),
	createdAt: helpers.dateToString,
	updatedAt: helpers.dateToString,
	deletedAt: v.nullable(helpers.dateToString)
});
export type ReadWhatsappThreadRest = v.InferOutput<typeof readWhatsappThreadRest>;

export const readWhatsappThreadZero = v.object({
	...whatsappThreadSchema.entries,
	startedAt: v.nullable(helpers.dateToTimestamp),
	completedAt: v.nullable(helpers.dateToTimestamp),
	createdAt: helpers.dateToTimestamp,
	updatedAt: helpers.dateToTimestamp,
	deletedAt: v.nullable(helpers.dateToTimestamp)
});
export type ReadWhatsappThreadZero = v.InferOutput<typeof readWhatsappThreadZero>;

export const createWhatsappThread = v.object({
	recipients: whatsappThreadSchema.entries.recipients,
	templateId: whatsappThreadSchema.entries.templateId,
	templateMessage: whatsappThreadSchema.entries.templateMessage,
	messages: whatsappThreadSchema.entries.messages,
	actions: whatsappThreadSchema.entries.actions
});
export type CreateWhatsappThread = v.InferInput<typeof createWhatsappThread>;

export const updateWhatsappThread = v.partial(
	v.object({
		...createWhatsappThread.entries
	})
);
export type UpdateWhatsappThread = v.InferInput<typeof updateWhatsappThread>;

export const mutatorMetadata = v.object({
	organizationId: whatsappThreadSchema.entries.organizationId,
	whatsappThreadId: whatsappThreadSchema.entries.id
});

export const createMutatorSchema = v.object({
	input: createWhatsappThread,
	metadata: mutatorMetadata
});
export type CreateMutatorSchema = v.InferInput<typeof createMutatorSchema>;
export type CreateMutatorSchemaOutput = v.InferOutput<typeof createMutatorSchema>;

export const updateMutatorSchema = v.object({
	input: updateWhatsappThread,
	metadata: mutatorMetadata
});
export type UpdateMutatorSchema = v.InferInput<typeof updateMutatorSchema>;
export type UpdateMutatorSchemaOutput = v.InferOutput<typeof updateMutatorSchema>;
