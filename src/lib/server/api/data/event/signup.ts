import { type PersonActionHelper, personActionHelper } from '$lib/schema/person';
import {
	type EventSignupDetails,
	eventSignupDetails,
	type EventSignupStatus,
	eventSignupStatus
} from '$lib/schema/event/settings';

import { type QueryContext, builder } from '$lib/zero/schema';

import {
	type CreateMutatorSchema,
	createMutatorSchema,
	type UpdateMutatorSchemaOutput,
	updateMutatorSchema
} from '$lib/schema/event-signup';

import { organizationReadPermissions } from '$lib/zero/query/organizations/permissions';
import { personReadPermissions } from '$lib/zero/query/person/permissions';
import { eventReadPermissions } from '$lib/zero/query/event/permissions';
import { eventSignupReadPermissions } from '$lib/zero/query/event_signup/permissions';

import { parse } from 'valibot';

import { event, eventSignup, person, organization } from '$lib/schema/drizzle';
import { getOrganizationByIdUnsafe } from '$lib/server/api/data/organization';
import { eq, and, not, inArray, sql } from 'drizzle-orm';
import type { ServerTransaction } from '@rocicorp/zero';
import { findOrCreatePerson } from '$lib/server/api/data/person/findOrCreate';
import { v7 as uuidv7 } from 'uuid';
import { getQueue } from '$lib/server/queue';
import { clampLocale } from '$lib/utils/language';

import {
	_getPersonByPhoneNumberUnsafe,
	_getPersonByIdUnsafe
} from '$lib/server/api/data/person/person';
import { applyTagToPersonUnsafe } from '$lib/server/api/data/person/tag';
export async function getEventByIdUnsafe({
	eventId,
	organizationId,
	tx
}: {
	tx: ServerTransaction;
	eventId: string;
	organizationId: string;
}) {
	const [eventResult] = await tx.dbTransaction.wrappedTransaction
		.select()
		.from(event)
		.where(and(eq(event.id, eventId), eq(event.organizationId, organizationId)));
	if (!eventResult) {
		throw new Error('Event not found');
	}
	return eventResult;
}

export async function getEventSignupsByEventIdUnsafe({
	eventId,
	organizationId,
	tx
}: {
	tx: ServerTransaction;
	eventId: string;
	organizationId: string;
}) {
	const eventSignups = await tx.dbTransaction.wrappedTransaction
		.select()
		.from(eventSignup)
		.where(and(eq(eventSignup.eventId, eventId), eq(eventSignup.organizationId, organizationId)));
	return eventSignups;
}

export async function signUpForEventWithId({
	eventId,
	teamId,
	tx,
	personId,
	organizationId,
	signupDetails,
	skipMaxSignupsCheck = false,
	skipNotifications = false,
	defaultEventSignupId
}: {
	eventId: string;
	teamId?: string;
	tx: ServerTransaction;
	personId: string;
	organizationId: string;
	signupDetails: EventSignupDetails;
	skipMaxSignupsCheck?: boolean;
	skipNotifications?: boolean;
	defaultEventSignupId?: string;
}) {
	const parsedSignupDetails = parse(eventSignupDetails, signupDetails);

	const eventResult = await getEventByIdUnsafe({ eventId, organizationId, tx });
	if (!eventResult) {
		throw new Error('Event not found');
	}
	if (!eventResult.published) {
		throw new Error('Event is not published');
	}
	// We could check if the event has started, but tbh we don't want to block the signup if the event has started

	const eventSignups = await getEventSignupsByEventIdUnsafe({ eventId, organizationId, tx });
	if (
		!skipMaxSignupsCheck &&
		eventResult.maxSignups &&
		eventResult.maxSignups <= eventSignups.length
	) {
		throw new Error('Event is full');
	}

	const eventSignupId = defaultEventSignupId || uuidv7();

	const personRecord = await _getPersonByIdUnsafe({ personId, organizationId, tx });
	if (!personRecord) {
		throw new Error('Person not found');
	}

	const organizationRecord = await getOrganizationByIdUnsafe({ organizationId, tx });

	const eventSignupResult = await signUpForEventUnsafe({
		tx,
		eventSignupId,
		eventRecord: eventResult,
		personRecord: personRecord,
		organizationRecord: organizationRecord,
		details: parsedSignupDetails
	});
	return eventSignupResult;
}

export async function signUpForEventHelper({
	eventId,
	teamId,
	tx,
	personAction,
	signupDetails,
	organizationId,
	skipMaxSignupsCheck = false,
	skipNotifications = false,
	defaultEventSignupId
}: {
	tx: ServerTransaction;
	eventId: string;
	personAction: PersonActionHelper;
	signupDetails: EventSignupDetails;
	organizationId: string;
	teamId?: string;
	skipMaxSignupsCheck?: boolean;
	skipNotifications?: boolean;
	defaultEventSignupId?: string;
}) {
	const parsedActionHelper = parse(personActionHelper, personAction);

	const eventSignupId = defaultEventSignupId || uuidv7();
	const personRecord = await findOrCreatePerson({
		tx,
		personAction: parsedActionHelper,
		addedFrom: {
			type: 'added_from_event',
			eventSignupId
		},
		organizationId,
		teamId
	});

	return await signUpForEventWithId({
		eventId,
		teamId,
		tx,
		personId: personRecord.id,
		organizationId,
		signupDetails,
		skipMaxSignupsCheck,
		skipNotifications,
		defaultEventSignupId: eventSignupId
	});
}

// the actual process of signing up for an event, broken off into its own function
export async function signUpForEventUnsafe({
	eventSignupId,
	eventRecord,
	personRecord,
	organizationRecord,
	tx,
	details,
	skipNotifications = false
}: {
	eventSignupId?: string;
	tx: ServerTransaction;
	eventRecord: typeof event.$inferSelect;
	personRecord: typeof person.$inferSelect;
	organizationRecord: typeof organization.$inferSelect;
	details: EventSignupDetails;
	skipNotifications?: boolean;
}) {
	const id = eventSignupId || uuidv7();
	const status = eventRecord.startsAt > new Date() ? 'signup' : 'attended';
	const eventSignupRecord: typeof eventSignup.$inferInsert = {
		id,
		organizationId: organizationRecord.id,
		eventId: eventRecord.id,
		personId: personRecord.id,
		details,
		status,
		createdAt: new Date(),
		updatedAt: new Date()
	};

	const [insertedEventSignup] = await tx.dbTransaction.wrappedTransaction
		.insert(eventSignup)
		.values(eventSignupRecord)
		.onConflictDoUpdate({
			target: [eventSignup.eventId, eventSignup.personId],
			set: {
				status: eventSignupRecord.status,
				updatedAt: new Date()
			},
			setWhere: sql`excluded.status not in ('attended', 'noshow')`
		})
		.returning();
	if (!insertedEventSignup) {
		throw new Error('Unable to create event signup');
	}

	if (!skipNotifications && details.channel.type === 'eventPage') {
		// Send the signup notification
		const queue = await getQueue();
		queue.sendEventRegistration({
			eventSignupId: id,
			locale: clampLocale(personRecord.preferredLanguage || organizationRecord.defaultLanguage)
		});
	}
	if (eventRecord.signupTag) {
		await applyTagToPersonUnsafe({
			tx,
			personId: personRecord.id,
			tagId: eventRecord.signupTag,
			organizationId: organizationRecord.id
		});
	}
	if (eventSignupRecord.status === 'attended' && eventRecord.attendanceTag) {
		await applyTagToPersonUnsafe({
			tx,
			personId: personRecord.id,
			tagId: eventRecord.attendanceTag,
			organizationId: organizationRecord.id
		});
	}
	//TODO: Implement whatsapp notification

	return insertedEventSignup;
}

export async function attendedEventHelper({
	eventId,
	teamId,
	tx,
	personAction,
	signupDetails,
	organizationId
}: {
	tx: ServerTransaction;
	eventId: string;
	personAction: PersonActionHelper;
	signupDetails: EventSignupDetails;
	organizationId: string;
	teamId?: string;
}) {
	const eventRecord = await getEventByIdUnsafe({ eventId, organizationId, tx });
	if (!eventRecord) {
		throw new Error('Event not found');
	}
	if (!eventRecord.published) {
		throw new Error('Event is not published');
	}

	//find or create the person
	const eventSignupIdIfNeeded = uuidv7();
	const personRecord = await findOrCreatePerson({
		personAction: personAction,
		teamId,
		addedFrom: {
			type: 'added_from_event',
			eventSignupId: eventSignupIdIfNeeded
		},
		organizationId,
		tx
	});

	//either get the existing signup or create a new one
	const eventSignupRecord = await getEventSignup({
		personId: personRecord.id,
		eventId,
		organizationId,
		tx
	}).catch(async (error) => {
		if (error instanceof Error && error.message === 'Event signup not found') {
			const organizationRecord = await getOrganizationByIdUnsafe({ organizationId, tx });
			return await signUpForEventUnsafe({
				eventSignupId: eventSignupIdIfNeeded,
				eventRecord: eventRecord,
				personRecord: personRecord,
				organizationRecord: organizationRecord,
				tx,
				details: signupDetails,
				skipNotifications: true
			});
		}
		throw error;
	});

	// if the signup is not attended, update the status to attended
	if (eventSignupRecord.status !== 'attended') {
		await updateEventSignupStatus({
			eventSignupId: eventSignupRecord.id,
			organizationId,
			status: 'attended',
			tx
		});
	}
	return eventSignupRecord;
}

export async function declineEventHelper({
	eventId,
	teamId,
	tx,
	personAction,
	signupDetails,
	organizationId
}: {
	tx: ServerTransaction;
	eventId: string;
	personAction: PersonActionHelper;
	signupDetails: EventSignupDetails;
	organizationId: string;
	teamId?: string;
}) {
	const parsedSignupDetails = parse(eventSignupDetails, signupDetails);
	const parsedActionHelper = parse(personActionHelper, personAction);

	const eventRecord = await getEventByIdUnsafe({ eventId, organizationId, tx });
	if (!eventRecord) {
		throw new Error('Event not found');
	}
	if (!eventRecord.published) {
		throw new Error('Event is not published');
	}

	const eventSignupId = uuidv7();

	const personRecord = await findOrCreatePerson({
		tx,
		personAction: parsedActionHelper,
		addedFrom: {
			type: 'added_from_event',
			eventSignupId
		},
		organizationId,
		teamId
	});

	const organizationRecord = await getOrganizationByIdUnsafe({ organizationId, tx });

	// Create event signup with notattending status
	const eventSignupRecord: typeof eventSignup.$inferInsert = {
		id: eventSignupId,
		organizationId: organizationRecord.id,
		eventId: eventRecord.id,
		personId: personRecord.id,
		details: parsedSignupDetails,
		status: 'notattending',
		createdAt: new Date(),
		updatedAt: new Date()
	};

	const [insertedEventSignup] = await tx.dbTransaction.wrappedTransaction
		.insert(eventSignup)
		.values(eventSignupRecord)
		.onConflictDoUpdate({
			target: [eventSignup.eventId, eventSignup.personId],
			set: {
				status: eventSignupRecord.status,
				updatedAt: new Date()
			},
			setWhere: sql`excluded.status not in ('attended', 'noshow')`
		})
		.returning();
	if (!insertedEventSignup) {
		throw new Error('Unable to create event signup');
	}

	const queue = await getQueue();
	await queue.insertActivity({
		organizationId,
		personId: personRecord.id,
		userId: undefined,
		type: 'event_not_attending',
		referenceId: insertedEventSignup.id,
		unread: false
	});

	return insertedEventSignup;
}

export async function getEventSignup({
	personId,
	eventId,
	organizationId,
	tx
}: {
	personId: string;
	eventId: string;
	organizationId: string;
	tx: ServerTransaction;
}) {
	const [eventSignupResult] = await tx.dbTransaction.wrappedTransaction
		.select()
		.from(eventSignup)
		.where(
			and(
				eq(eventSignup.personId, personId),
				eq(eventSignup.eventId, eventId),
				eq(eventSignup.organizationId, organizationId)
			)
		);
	if (!eventSignupResult) {
		throw new Error('Event signup not found');
	}
	return eventSignupResult;
}

export async function updateEventSignupStatus({
	eventSignupId,
	organizationId,
	status,
	tx
}: {
	eventSignupId: string;
	organizationId: string;
	status: EventSignupStatus;
	tx: ServerTransaction;
}) {
	const parsed = parse(eventSignupStatus, status);
	const [existing] = await tx.dbTransaction.wrappedTransaction
		.select()
		.from(eventSignup)
		.where(and(eq(eventSignup.id, eventSignupId), eq(eventSignup.organizationId, organizationId)));
	if (!existing) {
		throw new Error('Unable to update event signup');
	}
	const previousStatus = existing.status;
	const result = await tx.dbTransaction.wrappedTransaction
		.update(eventSignup)
		.set({ status: parsed })
		.where(and(eq(eventSignup.id, eventSignupId), eq(eventSignup.organizationId, organizationId)))
		.returning();
	if (!result) {
		throw new Error('Unable to update event signup');
	}
	if (parsed === 'attended' && previousStatus !== 'attended') {
		const eventRecord = await getEventByIdUnsafe({
			eventId: existing.eventId,
			organizationId,
			tx
		});
		if (eventRecord.attendanceTag) {
			await applyTagToPersonUnsafe({
				tx,
				personId: existing.personId,
				tagId: eventRecord.attendanceTag,
				organizationId
			});
		}
	}
	return result;
}

export async function createEventSignup({
	tx,
	ctx,
	args
}: {
	tx: ServerTransaction;
	ctx: QueryContext;
	args: CreateMutatorSchema;
}) {
	const parsed = parse(createMutatorSchema, args);
	const organization = await tx.run(
		builder.organization
			.where('id', parsed.metadata.organizationId)
			.where((expr) => organizationReadPermissions(expr, ctx))
			.one()
	);
	if (!organization) {
		throw new Error('Organization not found');
	}
	const person = await tx.run(
		builder.person
			.where((expr) => personReadPermissions(expr, ctx))
			.where('id', parsed.metadata.personId)
			.where((expr) => personReadPermissions(expr, ctx))
			.one()
	);
	if (!person) {
		throw new Error('Person not found');
	}
	const event = await tx.run(
		builder.event
			.where((expr) => eventReadPermissions(expr, ctx))
			.where('id', parsed.metadata.eventId)
			.where((expr) => eventReadPermissions(expr, ctx))
			.one()
	);
	if (!event) {
		throw new Error('Event not found');
	}

	const eventSignupRecord: typeof eventSignup.$inferInsert = {
		id: parsed.metadata.eventSignupId,
		organizationId: parsed.metadata.organizationId,
		eventId: parsed.metadata.eventId,
		personId: parsed.metadata.personId,
		details: parsed.input.details,
		status: parsed.input.status,
		createdAt: new Date(),
		updatedAt: new Date()
	};

	const [insertedEventSignup] = await tx.dbTransaction.wrappedTransaction
		.insert(eventSignup)
		.values(eventSignupRecord)
		.onConflictDoUpdate({
			target: [eventSignup.eventId, eventSignup.personId],
			set: {
				status: parsed.input.status,
				updatedAt: new Date()
			},
			setWhere: sql`excluded.status not in ('attended', 'noshow')`
		})
		.returning();
	if (!insertedEventSignup) {
		throw new Error('Unable to create event signup');
	}
	const queue = await getQueue();
	await queue.insertActivity({
		organizationId: parsed.metadata.organizationId,
		personId: parsed.metadata.personId,
		userId: ctx.userId || undefined,
		type: 'event_signup',
		referenceId: parsed.metadata.eventSignupId,
		unread: false
	});

	if (parsed.input.details.channel.type === 'eventPage') {
		await queue.sendEventRegistration({
			eventSignupId: parsed.metadata.eventSignupId,
			locale: clampLocale(person.preferredLanguage || organization.defaultLanguage)
		});
	}

	if (event.signupTag) {
		await applyTagToPersonUnsafe({
			tx,
			personId: parsed.metadata.personId,
			tagId: event.signupTag,
			organizationId: parsed.metadata.organizationId
		});
	}
	if (parsed.input.status === 'attended' && event.attendanceTag) {
		await applyTagToPersonUnsafe({
			tx,
			personId: parsed.metadata.personId,
			tagId: event.attendanceTag,
			organizationId: parsed.metadata.organizationId
		});
	}

	return insertedEventSignup;
}

export async function updateEventSignup({
	args,
	ctx,
	tx
}: {
	tx: ServerTransaction;
	ctx: QueryContext;
	args: UpdateMutatorSchemaOutput;
}) {
	const parsed = parse(updateMutatorSchema, args);
	const eventSignupRecord = await tx.run(
		builder.eventSignup
			.where('id', args.metadata.eventSignupId)
			.where('organizationId', args.metadata.organizationId)
			.where((expr) => eventSignupReadPermissions(expr, ctx))
			.one()
	);
	if (!eventSignupRecord) {
		throw new Error('Event signup not found');
	}
	const previousStatus = eventSignupRecord.status;
	const [result] = await tx.dbTransaction.wrappedTransaction
		.update(eventSignup)
		.set({
			status: args.input.status,
			updatedAt: new Date()
		})
		.where(
			and(
				eq(eventSignup.id, args.metadata.eventSignupId),
				eq(eventSignup.organizationId, args.metadata.organizationId)
			)
		)
		.returning();
	if (!result) {
		throw new Error('Unable to update event signup');
	}
	if (args.input.status === 'attended' && previousStatus !== 'attended') {
		const eventRecord = await getEventByIdUnsafe({
			eventId: eventSignupRecord.eventId,
			organizationId: args.metadata.organizationId,
			tx
		});
		if (eventRecord.attendanceTag) {
			await applyTagToPersonUnsafe({
				tx,
				personId: eventSignupRecord.personId,
				tagId: eventRecord.attendanceTag,
				organizationId: args.metadata.organizationId
			});
		}
	}
}
