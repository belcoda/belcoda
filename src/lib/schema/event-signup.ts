import * as v from 'valibot';
import * as helpers from '$lib/schema/helpers';

import { eventSignupDetails, eventSignupStatus } from '$lib/schema/event/settings';

export const eventSignupSchema = v.object({
	id: helpers.uuid,
	organizationId: helpers.uuid,
	eventId: helpers.uuid,
	personId: helpers.uuid,
	details: eventSignupDetails,
	status: eventSignupStatus,
	signupNotificationSentAt: v.nullable(helpers.date),
	reminderSentAt: v.nullable(helpers.date),
	cancellationNotificationSentAt: v.nullable(helpers.date),
	createdAt: helpers.date,
	updatedAt: helpers.date
});
export type EventSignupSchema = v.InferOutput<typeof eventSignupSchema>;

export const readEventSignupRest = v.object({
	...v.omit(eventSignupSchema, ['organizationId']).entries,
	signupNotificationSentAt: v.nullable(helpers.dateToString),
	reminderSentAt: v.nullable(helpers.dateToString),
	cancellationNotificationSentAt: v.nullable(helpers.dateToString),
	createdAt: helpers.dateToString,
	updatedAt: helpers.dateToString
});
export type ReadEventSignupRest = v.InferOutput<typeof readEventSignupRest>;

export const readEventSignupZero = v.object({
	...eventSignupSchema.entries,
	signupNotificationSentAt: v.nullable(helpers.dateToTimestamp),
	reminderSentAt: v.nullable(helpers.dateToTimestamp),
	cancellationNotificationSentAt: v.nullable(helpers.dateToTimestamp),
	createdAt: helpers.dateToTimestamp,
	updatedAt: helpers.dateToTimestamp
});
export type ReadEventSignupZero = v.InferOutput<typeof readEventSignupZero>;

export const createEventSignup = v.object({
	eventId: eventSignupSchema.entries.eventId,
	personId: eventSignupSchema.entries.personId,
	details: eventSignupSchema.entries.details,
	status: eventSignupSchema.entries.status
});

export type CreateEventSignup = v.InferInput<typeof createEventSignup>;

export const updateEventSignup = v.object({
	status: eventSignupSchema.entries.status
});
export type UpdateEventSignup = v.InferInput<typeof updateEventSignup>;

export const mutatorMetadata = v.object({
	organizationId: eventSignupSchema.entries.organizationId,
	eventId: eventSignupSchema.entries.eventId,
	personId: eventSignupSchema.entries.personId,
	eventSignupId: eventSignupSchema.entries.id
});
export type MutatorMetadata = v.InferOutput<typeof mutatorMetadata>;

export const createMutatorSchema = v.object({
	input: createEventSignup,
	metadata: mutatorMetadata
});
export type CreateMutatorSchema = v.InferInput<typeof createMutatorSchema>;
export type CreateMutatorSchemaOutput = v.InferOutput<typeof createMutatorSchema>;

export const updateMutatorSchema = v.object({
	input: updateEventSignup,
	metadata: mutatorMetadata
});
export type UpdateMutatorSchema = v.InferInput<typeof updateMutatorSchema>;
export type UpdateMutatorSchemaOutput = v.InferOutput<typeof updateMutatorSchema>;
