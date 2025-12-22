import * as v from 'valibot';
import * as helpers from '$lib/schema/helpers';

import { eventSettingsSchema } from '$lib/schema/event/settings';

export const eventSchema = v.object({
	id: helpers.uuid,
	organizationId: helpers.uuid,
	teamId: v.nullable(helpers.uuid),

	slug: helpers.slug,
	title: helpers.mediumString,
	shortDescription: helpers.mediumString, //500 chars
	description: v.nullable(v.any()),

	published: v.boolean(),

	startsAt: helpers.date,
	endsAt: helpers.date,

	onlineLink: v.nullable(helpers.url),

	addressLine1: v.nullable(helpers.mediumString),
	addressLine2: v.nullable(helpers.mediumString),
	locality: v.nullable(helpers.mediumString),
	region: v.nullable(helpers.mediumString),
	postcode: v.nullable(helpers.shortString),

	country: helpers.countryCode,
	timezone: helpers.shortString,

	maxSignups: v.nullable(helpers.count),
	featureImage: v.nullable(helpers.url),
	settings: eventSettingsSchema,

	signupTag: v.nullable(helpers.uuid),
	attendanceTag: v.nullable(helpers.uuid),

	sendReminderHoursBefore: v.nullable(helpers.count),
	reminderSentAt: v.nullable(helpers.date),

	createdAt: helpers.date,
	updatedAt: helpers.date,
	deletedAt: v.nullable(helpers.date),
	archivedAt: v.nullable(helpers.date),
	cancelledAt: v.nullable(helpers.date)
});
export type EventSchema = v.InferOutput<typeof eventSchema>;

export const readEventRest = v.object({
	...v.omit(eventSchema, ['organizationId']).entries,
	startsAt: helpers.dateToString,
	endsAt: helpers.dateToString,
	reminderSentAt: v.nullable(helpers.dateToString),
	createdAt: helpers.dateToString,
	updatedAt: helpers.dateToString,
	deletedAt: v.nullable(helpers.dateToString),
	archivedAt: v.nullable(helpers.dateToString),
	cancelledAt: v.nullable(helpers.dateToString)
});
export type ReadEventRest = v.InferOutput<typeof readEventRest>;

export const readEventZero = v.object({
	...eventSchema.entries,
	startsAt: helpers.dateToTimestamp,
	endsAt: helpers.dateToTimestamp,
	reminderSentAt: v.nullable(helpers.dateToTimestamp),
	createdAt: helpers.dateToTimestamp,
	updatedAt: helpers.dateToTimestamp,
	deletedAt: v.nullable(helpers.dateToTimestamp),
	archivedAt: v.nullable(helpers.dateToTimestamp),
	cancelledAt: v.nullable(helpers.dateToTimestamp)
});
export type ReadEventZero = v.InferOutput<typeof readEventZero>;

export const createEvent = v.object({
	title: eventSchema.entries.title,
	slug: eventSchema.entries.slug,
	shortDescription: eventSchema.entries.shortDescription,
	description: v.optional(eventSchema.entries.description, null),
	startsAt: eventSchema.entries.startsAt,
	endsAt: eventSchema.entries.endsAt,
	onlineLink: v.optional(eventSchema.entries.onlineLink, null),
	addressLine1: v.optional(eventSchema.entries.addressLine1, null),
	addressLine2: v.optional(eventSchema.entries.addressLine2, null),
	locality: v.optional(eventSchema.entries.locality, null),
	region: v.optional(eventSchema.entries.region, null),
	postcode: v.optional(eventSchema.entries.postcode, null),
	country: eventSchema.entries.country,
	timezone: eventSchema.entries.timezone,
	maxSignups: v.optional(eventSchema.entries.maxSignups, null),
	featureImage: v.optional(eventSchema.entries.featureImage, null),
	settings: eventSchema.entries.settings,
	signupTag: v.optional(eventSchema.entries.signupTag, null),
	attendanceTag: v.optional(eventSchema.entries.attendanceTag, null),
	teamId: v.optional(eventSchema.entries.teamId, null),
	sendReminderHoursBefore: v.optional(eventSchema.entries.sendReminderHoursBefore, null)
});
export type CreateEvent = v.InferInput<typeof createEvent>;

export const createEventZero = v.object({
	...createEvent.entries,
	startsAt: helpers.unixTimestamp,
	endsAt: helpers.unixTimestamp
});
export type CreateEventZero = v.InferOutput<typeof createEventZero>;

export const updateEvent = v.partial(
	v.object({
		...createEvent.entries
	})
);
export type UpdateEvent = v.InferInput<typeof updateEvent>;

export const updateEventZero = v.object({
	...updateEvent.entries,
	startsAt: helpers.unixTimestamp,
	endsAt: helpers.unixTimestamp
});
export type UpdateEventZero = v.InferOutput<typeof updateEventZero>;

export const mutatorMetadata = v.object({
	organizationId: eventSchema.entries.organizationId,
	eventId: eventSchema.entries.id,
	teamId: v.optional(eventSchema.entries.teamId, null)
});
export type MutatorMetadata = v.InferOutput<typeof mutatorMetadata>;

export const createMutatorSchema = v.object({
	input: createEvent,
	metadata: mutatorMetadata
});
export type CreateMutatorSchema = v.InferInput<typeof createMutatorSchema>;
export type CreateMutatorSchemaOutput = v.InferOutput<typeof createMutatorSchema>;

export const updateMutatorSchema = v.object({
	input: updateEvent,
	metadata: mutatorMetadata
});
export type UpdateMutatorSchema = v.InferInput<typeof updateMutatorSchema>;
export type UpdateMutatorSchemaOutput = v.InferOutput<typeof updateMutatorSchema>;
