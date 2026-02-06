import * as v from 'valibot';
import * as helpers from '$lib/schema/helpers';

export const webhookVerificationModes = ['api_key', 'signature'] as const;
export const webhookVerificationModesSchema = v.picklist(webhookVerificationModes);
export type WebhookVerificationModes = v.InferOutput<typeof webhookVerificationModesSchema>;

export const webhookStatus = ['pending', 'success', 'failed'] as const;
export const webhookStatusSchema = v.picklist(webhookStatus);
export type WebhookStatus = v.InferOutput<typeof webhookStatusSchema>;

export const webhookEvents = [
	//event
	'event.created',
	'event.updated',
	'event.deleted',
	'eventsignup.created',
	'eventsignup.updated',
	'eventsignup.deleted',
	//person
	'person.created',
	'person.updated',
	'person.deleted',
	'person.note.created',
	'person.note.updated',
	'person.note.deleted',
	'person.import.created',
	//activity
	'activity.created',
	//petition
	'petition.created',
	'petition.updated',
	'petition.deleted',
	'petition_signature.created',
	'petition_signature.updated',
	'petition_signature.deleted',
	//tag
	'tag.created',
	'tag.updated',
	'tag.deleted',
	'tag.person_added',
	'tag.person_removed',
	//team
	'team.created',
	'team.updated',
	'team.deleted',
	'team.person_added',
	'team.person_removed',
	// whatsapp
	'whatsapp.message.incoming',
	'whatsapp.message.outgoing',
	'whatsapp.group.message.incoming',
	'whatsapp.group.joined',
	'whatsapp.group.left',
	'whatsapp.group.removed',
	'whatsapp.group.updated',
	'whatsapp.thread.created',
	'whatsapp.thread.updated',
	'whatsapp.thread.deleted',
	//email
	'email.message.created',
	'email.message.updated',
	'email.message.deleted'
] as const;
export const webhookEventsSchema = v.array(v.picklist(webhookEvents));
export type WebhookEvents = v.InferOutput<typeof webhookEventsSchema>;

// this is the type that is used in the database, it includes the 'all' event type so we're defining it
export const webhookEventTypes = ['all', ...webhookEvents] as const;
export const webhookEventTypesSchema = v.array(v.picklist(webhookEventTypes));
export type WebhookEventTypes = v.InferOutput<typeof webhookEventTypesSchema>;

export const webhookPayloadSchema = helpers.jsonSchema;
export type WebhookPayload = v.InferOutput<typeof webhookPayloadSchema>;

export const webhookSchema = v.object({
	id: helpers.uuid,
	organizationId: helpers.uuid,
	name: helpers.mediumString,
	targetUrl: helpers.url,
	secret: helpers.mediumString,
	verificationMode: v.picklist(webhookVerificationModes),
	enabled: v.boolean(),
	eventTypes: webhookEventTypesSchema,
	createdAt: helpers.date,
	updatedAt: helpers.date,
	lastSuccessAt: v.nullable(helpers.date),
	lastFailureAt: v.nullable(helpers.date)
});
export type WebhookSchema = v.InferOutput<typeof webhookSchema>;

export const readWebhookRest = v.object({
	id: webhookSchema.entries.id,
	name: webhookSchema.entries.name,
	targetUrl: webhookSchema.entries.targetUrl,
	verificationMode: webhookSchema.entries.verificationMode,
	enabled: webhookSchema.entries.enabled,
	eventTypes: webhookSchema.entries.eventTypes,
	createdAt: helpers.dateToString,
	updatedAt: helpers.dateToString,
	lastSuccessAt: v.nullable(helpers.dateToString),
	lastFailureAt: v.nullable(helpers.dateToString)
});
export type ReadWebhookRest = v.InferOutput<typeof readWebhookRest>;

export const readWebhookZero = v.object({
	...readWebhookRest.entries,
	createdAt: helpers.dateToTimestamp,
	updatedAt: helpers.dateToTimestamp,
	lastSuccessAt: v.nullable(helpers.dateToTimestamp),
	lastFailureAt: v.nullable(helpers.dateToTimestamp)
});
export type ReadWebhookZero = v.InferOutput<typeof readWebhookZero>;

export const createWebhook = v.object({
	name: webhookSchema.entries.name,
	targetUrl: webhookSchema.entries.targetUrl,
	eventTypes: webhookSchema.entries.eventTypes,
	secret: v.optional(webhookSchema.entries.secret)
});
export type CreateWebhook = v.InferOutput<typeof createWebhook>;

export const createWebhookZero = v.object({
	name: webhookSchema.entries.name,
	targetUrl: webhookSchema.entries.targetUrl,
	eventTypes: webhookSchema.entries.eventTypes,
	secret: v.optional(webhookSchema.entries.secret)
});
export type CreateWebhookZero = v.InferOutput<typeof createWebhookZero>;

export const updateWebhook = v.partial(
	v.object({
		name: webhookSchema.entries.name,
		targetUrl: webhookSchema.entries.targetUrl,
		eventTypes: webhookSchema.entries.eventTypes,
		secret: webhookSchema.entries.secret,
		enabled: webhookSchema.entries.enabled
	})
);
export type UpdateWebhook = v.InferOutput<typeof updateWebhook>;

export const mutatorMetadata = v.object({
	organizationId: helpers.uuid,
	webhookId: helpers.uuid
});
export type MutatorMetadata = v.InferOutput<typeof mutatorMetadata>;

export const createMutatorSchema = v.object({
	input: createWebhook,
	metadata: mutatorMetadata
});
export const createMutatorSchemaZero = v.object({
	input: createWebhookZero,
	metadata: mutatorMetadata
});
export type CreateMutatorSchemaZeroInput = v.InferInput<typeof createMutatorSchemaZero>;
export type CreateMutatorSchemaZeroOutput = v.InferOutput<typeof createMutatorSchemaZero>;

export const deleteMutatorSchemaZero = v.object({
	metadata: mutatorMetadata
});
export type DeleteMutatorSchemaZero = v.InferOutput<typeof deleteMutatorSchemaZero>;
