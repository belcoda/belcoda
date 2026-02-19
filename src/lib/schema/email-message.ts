import * as v from 'valibot';
import * as helpers from '$lib/schema/helpers';

import { filterGroup } from '$lib/schema/person/filter';

export const emailMessageSchema = v.object({
	id: helpers.uuid,
	organizationId: helpers.uuid,
	teamId: v.nullable(helpers.uuid),
	emailFromSignatureId: v.nullable(helpers.uuid),
	replyToOverride: v.nullable(helpers.email),
	recipients: filterGroup,
	previewTextOverride: v.nullable(helpers.mediumString),
	previewTextLock: v.boolean(),
	subject: v.nullable(helpers.mediumStringEmpty),
	body: v.nullable(v.any()),
	sentBy: v.nullable(helpers.uuid),
	startedAt: v.nullable(helpers.date),
	completedAt: v.nullable(helpers.date),
	estimatedRecipientCount: helpers.count,
	successfulRecipientCount: helpers.count,
	failedRecipientCount: helpers.count,
	createdAt: helpers.date,
	updatedAt: helpers.date,
	deletedAt: v.nullable(helpers.date)
});
export type EmailMessageSchema = v.InferOutput<typeof emailMessageSchema>;

export const readEmailMessageRest = v.object({
	...v.omit(emailMessageSchema, ['organizationId']).entries,
	startedAt: v.nullable(helpers.dateToString),
	completedAt: v.nullable(helpers.dateToString),
	createdAt: helpers.dateToString,
	updatedAt: helpers.dateToString,
	deletedAt: v.nullable(helpers.dateToString)
});
export type ReadEmailMessageRest = v.InferOutput<typeof readEmailMessageRest>;

export const readEmailMessageZero = v.object({
	...emailMessageSchema.entries,
	startedAt: v.nullable(helpers.dateToTimestamp),
	completedAt: v.nullable(helpers.dateToTimestamp),
	createdAt: helpers.dateToTimestamp,
	updatedAt: helpers.dateToTimestamp,
	deletedAt: v.nullable(helpers.dateToTimestamp)
});
export type ReadEmailMessageZero = v.InferOutput<typeof readEmailMessageZero>;

export const createEmailMessage = v.object({
	emailFromSignatureId: emailMessageSchema.entries.emailFromSignatureId,
	replyToOverride: v.optional(v.nullable(emailMessageSchema.entries.replyToOverride), null),
	recipients: emailMessageSchema.entries.recipients,
	previewTextOverride: v.optional(v.nullable(emailMessageSchema.entries.previewTextOverride), null),
	previewTextLock: v.optional(emailMessageSchema.entries.previewTextLock, false),
	subject: v.optional(v.nullable(emailMessageSchema.entries.subject), null),
	body: v.optional(v.nullable(emailMessageSchema.entries.body), null)
});
export type CreateEmailMessage = v.InferInput<typeof createEmailMessage>;

export const updateEmailMessage = v.partial(
	v.object({
		...createEmailMessage.entries
	})
);
export type UpdateEmailMessage = v.InferInput<typeof updateEmailMessage>;

export const sendEmailMessage = v.object({
	subject: v.optional(v.nullable(emailMessageSchema.entries.subject), null),
	body: v.optional(v.nullable(emailMessageSchema.entries.body), null)
});
export type SendEmailMessage = v.InferInput<typeof sendEmailMessage>;

export const mutatorMetadata = v.object({
	organizationId: emailMessageSchema.entries.organizationId,
	emailMessageId: emailMessageSchema.entries.id
});
export type MutatorMetadata = v.InferOutput<typeof mutatorMetadata>;

export const createMutatorSchema = v.object({
	input: createEmailMessage,
	metadata: mutatorMetadata
});
export type CreateMutatorSchema = v.InferInput<typeof createMutatorSchema>;
export type CreateMutatorSchemaOutput = v.InferOutput<typeof createMutatorSchema>;

export const updateMutatorSchema = v.object({
	input: updateEmailMessage,
	metadata: mutatorMetadata
});
export type UpdateMutatorSchema = v.InferInput<typeof updateMutatorSchema>;
export type UpdateMutatorSchemaOutput = v.InferOutput<typeof updateMutatorSchema>;

export const sendMutatorSchema = v.object({
	input: sendEmailMessage,
	metadata: mutatorMetadata
});
export type SendMutatorSchema = v.InferInput<typeof sendMutatorSchema>;
export type SendMutatorSchemaOutput = v.InferOutput<typeof sendMutatorSchema>;

export function createDefaultEmailMessage({
	id,
	organizationId,
	teamId
}: {
	id: string;
	teamId?: string | null;
	organizationId: string;
}) {
	return {
		id,
		organizationId,
		teamId: null,
		emailFromSignatureId: null,
		replyToOverride: null,
		recipients: { type: 'or' as const, filters: [], exclude: [] },
		previewTextOverride: null,
		previewTextLock: false,
		subject: null,
		body: null,
		sentBy: null,
		startedAt: null,
		completedAt: null,
		estimatedRecipientCount: 0,
		successfulRecipientCount: 0,
		failedRecipientCount: 0,
		createdAt: new Date().getTime(),
		updatedAt: new Date().getTime(),
		deletedAt: null
	};
}

export const deleteMutatorSchema = v.object({
	id: helpers.uuid,
	organizationId: helpers.uuid
});
