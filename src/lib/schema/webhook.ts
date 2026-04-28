import * as v from 'valibot';
import * as helpers from '$lib/schema/helpers';

export const webhookVerificationModes = ['api_key', 'signature'] as const;
export const webhookVerificationModesSchema = v.picklist(webhookVerificationModes);
export type WebhookVerificationModes = v.InferOutput<typeof webhookVerificationModesSchema>;

export const webhookStatus = ['not_sent', 'success', 'failed'] as const;
export const webhookStatusSchema = v.picklist(webhookStatus);
export type WebhookStatus = v.InferOutput<typeof webhookStatusSchema>;

export const webhookEvents = [
	//event
	'event.created',
	'event.updated',
	'event.deleted',
	'event.signup.created',
	'event.signup.updated',
	'event.signup.deleted',
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
	'petition.signature.created',
	'petition.signature.updated',
	'petition.signature.deleted',
	//tag
	'tag.created',
	'tag.updated',
	'tag.deleted',
	'tag.person.added',
	'tag.person.removed',
	//team
	'team.created',
	'team.updated',
	'team.deleted',
	'team.person.added',
	'team.person.removed',
	'team.user.added',
	'team.user.removed',
	// whatsapp
	'whatsapp.message.created',
	'whatsapp.message.updated',
	'whatsapp.message.deleted',
	'whatsapp.thread.created',
	'whatsapp.thread.updated',
	'whatsapp.thread.deleted',
	//email
	'email.message.created',
	'email.message.updated',
	'email.message.deleted',

	//organization
	'organization.updated',

	//member
	'member.created',
	'member.updated',
	'member.deleted'
] as const;
export const webhookEventSchema = v.picklist(webhookEvents);
export const webhookEventsSchema = v.array(webhookEventSchema);
export type WebhookEvent = v.InferOutput<typeof webhookEventSchema>;
export type WebhookEvents = v.InferOutput<typeof webhookEventsSchema>;

// this is the type that is used in the database, it includes the 'all' event type so we're defining it
export const webhookEventTypes = ['all', ...webhookEvents] as const;
export const webhookEventTypesSchema = v.array(v.picklist(webhookEventTypes));
export type WebhookEventTypes = v.InferOutput<typeof webhookEventTypesSchema>;

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

import { eventWebhook } from '$lib/schema/event';
export const eventCreatedWebhookSchema = v.object({
	type: v.literal('event.created'),
	data: eventWebhook
});
export const eventUpdatedWebhookSchema = v.object({
	type: v.literal('event.updated'),
	data: eventWebhook
});
export const eventDeletedWebhookSchema = v.object({
	type: v.literal('event.deleted'),
	data: v.object({
		eventId: helpers.uuid
	})
});

import { eventSignupWebhook } from '$lib/schema/event-signup';
export const eventSignupCreatedWebhookSchema = v.object({
	type: v.literal('event.signup.created'),
	data: eventSignupWebhook
});
export const eventSignupUpdatedWebhookSchema = v.object({
	type: v.literal('event.signup.updated'),
	data: eventSignupWebhook
});
export const eventSignupDeletedWebhookSchema = v.object({
	type: v.literal('event.signup.deleted'),
	data: v.object({
		eventSignupId: helpers.uuid
	})
});

import { personWebhook } from '$lib/schema/person';
export const personCreatedWebhookSchema = v.object({
	type: v.literal('person.created'),
	data: personWebhook
});
export const personUpdatedWebhookSchema = v.object({
	type: v.literal('person.updated'),
	data: personWebhook
});
export const personDeletedWebhookSchema = v.object({
	type: v.literal('person.deleted'),
	data: v.object({
		personId: helpers.uuid
	})
});
import { personNoteWebhook } from '$lib/schema/person-note';
export const personNoteCreatedWebhookSchema = v.object({
	type: v.literal('person.note.created'),
	data: personNoteWebhook
});
export const personNoteUpdatedWebhookSchema = v.object({
	type: v.literal('person.note.updated'),
	data: personNoteWebhook
});
export const personNoteDeletedWebhookSchema = v.object({
	type: v.literal('person.note.deleted'),
	data: v.object({
		personNoteId: helpers.uuid
	})
});
import { personImportWebhook } from '$lib/schema/person-import';
export const personImportCreatedWebhookSchema = v.object({
	type: v.literal('person.import.created'),
	data: personImportWebhook
});

import { activityWebhook } from '$lib/schema/activity';
export const activityCreatedWebhookSchema = v.object({
	type: v.literal('activity.created'),
	data: activityWebhook
});

import { petitionWebhook } from '$lib/schema/petition/petition';
export const petitionCreatedWebhookSchema = v.object({
	type: v.literal('petition.created'),
	data: petitionWebhook
});
export const petitionUpdatedWebhookSchema = v.object({
	type: v.literal('petition.updated'),
	data: petitionWebhook
});
export const petitionDeletedWebhookSchema = v.object({
	type: v.literal('petition.deleted'),
	data: v.object({
		petitionId: helpers.uuid
	})
});

import { petitionSignatureWebhook } from '$lib/schema/petition/petition-signature';
export const petitionSignatureCreatedWebhookSchema = v.object({
	type: v.literal('petition.signature.created'),
	data: petitionSignatureWebhook
});
export const petitionSignatureUpdatedWebhookSchema = v.object({
	type: v.literal('petition.signature.updated'),
	data: petitionSignatureWebhook
});
export const petitionSignatureDeletedWebhookSchema = v.object({
	type: v.literal('petition.signature.deleted'),
	data: v.object({
		petitionSignatureId: helpers.uuid
	})
});

import { tagWebhook, personTagWebhook } from '$lib/schema/tag';
export const tagCreatedWebhookSchema = v.object({
	type: v.literal('tag.created'),
	data: tagWebhook
});
export const tagUpdatedWebhookSchema = v.object({
	type: v.literal('tag.updated'),
	data: tagWebhook
});
export const tagDeletedWebhookSchema = v.object({
	type: v.literal('tag.deleted'),
	data: v.object({
		tagId: helpers.uuid
	})
});
export const personTagAddedWebhookSchema = v.object({
	type: v.literal('tag.person.added'),
	data: personTagWebhook
});
export const personTagRemovedWebhookSchema = v.object({
	type: v.literal('tag.person.removed'),
	data: personTagWebhook
});

import { teamWebhook, teamPersonWebhook, teamUserWebhook } from '$lib/schema/team';
export const teamCreatedWebhookSchema = v.object({
	type: v.literal('team.created'),
	data: teamWebhook
});
export const teamUpdatedWebhookSchema = v.object({
	type: v.literal('team.updated'),
	data: teamWebhook
});
export const teamDeletedWebhookSchema = v.object({
	type: v.literal('team.deleted'),
	data: v.object({
		teamId: helpers.uuid
	})
});
export const teamPersonAddedWebhookSchema = v.object({
	type: v.literal('team.person.added'),
	data: teamPersonWebhook
});
export const teamPersonRemovedWebhookSchema = v.object({
	type: v.literal('team.person.removed'),
	data: teamPersonWebhook
});
export const teamUserAddedWebhookSchema = v.object({
	type: v.literal('team.user.added'),
	data: teamUserWebhook
});
export const teamUserRemovedWebhookSchema = v.object({
	type: v.literal('team.user.removed'),
	data: teamUserWebhook
});

import { whatsappMessageWebhook } from '$lib/schema/whatsapp-message';
export const whatsappMessageCreatedWebhookSchema = v.object({
	type: v.literal('whatsapp.message.created'),
	data: whatsappMessageWebhook
});
export const whatsappMessageUpdatedWebhookSchema = v.object({
	type: v.literal('whatsapp.message.updated'),
	data: whatsappMessageWebhook
});
export const whatsappMessageDeletedWebhookSchema = v.object({
	type: v.literal('whatsapp.message.deleted'),
	data: v.object({
		whatsappMessageId: helpers.uuid
	})
});

import { whatsappThreadWebhook } from '$lib/schema/whatsapp-thread';
export const whatsappThreadCreatedWebhookSchema = v.object({
	type: v.literal('whatsapp.thread.created'),
	data: whatsappThreadWebhook
});
export const whatsappThreadUpdatedWebhookSchema = v.object({
	type: v.literal('whatsapp.thread.updated'),
	data: whatsappThreadWebhook
});
export const whatsappThreadDeletedWebhookSchema = v.object({
	type: v.literal('whatsapp.thread.deleted'),
	data: v.object({
		whatsappThreadId: helpers.uuid
	})
});

import { emailMessageWebhook } from '$lib/schema/email-message';
export const emailMessageCreatedWebhookSchema = v.object({
	type: v.literal('email.message.created'),
	data: emailMessageWebhook
});
export const emailMessageUpdatedWebhookSchema = v.object({
	type: v.literal('email.message.updated'),
	data: emailMessageWebhook
});
export const emailMessageDeletedWebhookSchema = v.object({
	type: v.literal('email.message.deleted'),
	data: v.object({
		emailMessageId: helpers.uuid
	})
});

import { organizationWebhook, organizationMemberWebhook } from '$lib/schema/organization';
export const organizationUpdatedWebhookSchema = v.object({
	type: v.literal('organization.updated'),
	data: organizationWebhook
});
export const organizationMemberCreatedWebhookSchema = v.object({
	type: v.literal('member.created'),
	data: organizationMemberWebhook
});
export const organizationMemberUpdatedWebhookSchema = v.object({
	type: v.literal('member.updated'),
	data: organizationMemberWebhook
});
export const organizationMemberDeletedWebhookSchema = v.object({
	type: v.literal('member.deleted'),
	data: v.object({
		organizationId: helpers.uuid,
		userId: helpers.uuid
	})
});

export const webhookPayloadSchema = v.variant('type', [
	eventCreatedWebhookSchema,
	eventUpdatedWebhookSchema,
	eventDeletedWebhookSchema,
	eventSignupCreatedWebhookSchema,
	eventSignupUpdatedWebhookSchema,
	eventSignupDeletedWebhookSchema,
	personCreatedWebhookSchema,
	personUpdatedWebhookSchema,
	personDeletedWebhookSchema,
	personNoteCreatedWebhookSchema,
	personNoteUpdatedWebhookSchema,
	personNoteDeletedWebhookSchema,
	personImportCreatedWebhookSchema,
	activityCreatedWebhookSchema,
	petitionCreatedWebhookSchema,
	petitionUpdatedWebhookSchema,
	petitionDeletedWebhookSchema,
	petitionSignatureCreatedWebhookSchema,
	petitionSignatureUpdatedWebhookSchema,
	petitionSignatureDeletedWebhookSchema,
	tagCreatedWebhookSchema,
	tagUpdatedWebhookSchema,
	tagDeletedWebhookSchema,
	personTagAddedWebhookSchema,
	personTagRemovedWebhookSchema,
	teamCreatedWebhookSchema,
	teamUpdatedWebhookSchema,
	teamDeletedWebhookSchema,
	teamPersonAddedWebhookSchema,
	teamPersonRemovedWebhookSchema,
	teamUserAddedWebhookSchema,
	teamUserRemovedWebhookSchema,
	whatsappMessageCreatedWebhookSchema,
	whatsappMessageUpdatedWebhookSchema,
	whatsappMessageDeletedWebhookSchema,
	whatsappThreadCreatedWebhookSchema,
	whatsappThreadUpdatedWebhookSchema,
	whatsappThreadDeletedWebhookSchema,
	emailMessageCreatedWebhookSchema,
	emailMessageUpdatedWebhookSchema,
	emailMessageDeletedWebhookSchema,
	organizationUpdatedWebhookSchema,
	organizationMemberCreatedWebhookSchema,
	organizationMemberUpdatedWebhookSchema,
	organizationMemberDeletedWebhookSchema
]);
export type WebhookPayload = v.InferOutput<typeof webhookPayloadSchema>;

export const webhookPayloadDataSchema = v.union(
	webhookPayloadSchema.options.map((option) => option.entries.data)
);
export type WebhookPayloadData = v.InferOutput<typeof webhookPayloadDataSchema>;
export const webhookLogPayloadSchema = v.object({
	id: helpers.uuid,
	type: webhookEventSchema,
	createdAt: helpers.isoTimestamp,
	apiVersion: helpers.mediumString,
	data: webhookPayloadDataSchema
});
export type WebhookLogPayload = v.InferOutput<typeof webhookLogPayloadSchema>;
