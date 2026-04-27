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
import { eq, and, sql } from 'drizzle-orm';
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

/** Applies the event attendance tag when status becomes attended (idempotent for repeat attended). */
export async function applyAttendanceTagIfNeeded({
	tx,
	eventId,
	personId,
	organizationId,
	newStatus,
	previousStatus
}: {
	tx: ServerTransaction;
	eventId: string;
	personId: string;
	organizationId: string;
	newStatus: EventSignupStatus;
	previousStatus: EventSignupStatus | undefined;
}) {
	if (newStatus !== 'attended' || previousStatus === 'attended') {
		return;
	}
	const eventRecord = await getEventByIdUnsafe({ eventId, organizationId, tx });
	if (!eventRecord.attendanceTag) {
		return;
	}
	await applyTagToPersonUnsafe({
		tx,
		personId,
		tagId: eventRecord.attendanceTag,
		organizationId
	});
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

// comples a signup when a flow is compelte (ie: goes from incomplete to either signed up or attended, depending on the event start time)
function resolveCompletedEventSignupStatus(
	eventRecord: typeof event.$inferSelect
): EventSignupStatus {
	return eventRecord.startsAt > new Date() ? 'signup' : 'attended';
}

function isCompleteEventSignupStatus(status: EventSignupStatus | null | undefined) {
	return status === 'signup' || status === 'attended' || status === 'noshow';
}

function getEventHasEnded(eventRecord: typeof event.$inferSelect) {
	return eventRecord.endsAt <= new Date();
}

function assertEventSignupWindowOpen(eventRecord: typeof event.$inferSelect) {
	if (getEventHasEnded(eventRecord)) {
		throw new Error('Event signup period has ended');
	}
}

function mergeSignupDetails(
	existing: EventSignupDetails,
	incoming: EventSignupDetails
): EventSignupDetails {
	return {
		channel: existing.channel ?? incoming.channel,
		customFields: {
			...(existing.customFields || {}),
			...(incoming.customFields || {})
		}
	};
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
	assertEventSignupWindowOpen(eventResult);
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

export async function createIncompleteEventSignupHelper({
	eventId,
	teamId,
	tx,
	personAction,
	signupDetails,
	organizationId,
	defaultEventSignupId
}: {
	tx: ServerTransaction;
	eventId: string;
	personAction: PersonActionHelper;
	signupDetails: EventSignupDetails;
	organizationId: string;
	teamId?: string;
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
		teamId,
		updateExistingPerson: true
	});

	return await createIncompleteEventSignupByPersonId({
		eventId,
		tx,
		personId: personRecord.id,
		organizationId,
		signupDetails,
		defaultEventSignupId: eventSignupId
	});
}

export async function createIncompleteEventSignupByPersonId({
	eventId,
	tx,
	personId,
	organizationId,
	signupDetails,
	defaultEventSignupId
}: {
	tx: ServerTransaction;
	eventId: string;
	personId: string;
	organizationId: string;
	signupDetails: EventSignupDetails;
	defaultEventSignupId?: string;
}) {
	const parsedSignupDetails = parse(eventSignupDetails, signupDetails);
	const eventRecord = await getEventByIdUnsafe({ eventId, organizationId, tx });
	if (!eventRecord.published) {
		throw new Error('Event is not published');
	}
	assertEventSignupWindowOpen(eventRecord);

	const [existingEventSignup] = await tx.dbTransaction.wrappedTransaction
		.select()
		.from(eventSignup)
		.where(
			and(
				eq(eventSignup.eventId, eventId),
				eq(eventSignup.personId, personId),
				eq(eventSignup.organizationId, organizationId)
			)
		)
		.limit(1);

	const eventSignupId = existingEventSignup?.id || defaultEventSignupId || uuidv7();
	const detailsToPersist = existingEventSignup
		? mergeSignupDetails(existingEventSignup.details, parsedSignupDetails)
		: parsedSignupDetails;

	if (existingEventSignup) {
		const [updated] = await tx.dbTransaction.wrappedTransaction
			.update(eventSignup)
			.set({
				details: detailsToPersist,
				updatedAt: new Date()
			})
			.where(eq(eventSignup.id, existingEventSignup.id))
			.returning();
		if (!updated) {
			throw new Error('Unable to update existing event signup');
		}
		return updated;
	}

	const [inserted] = await tx.dbTransaction.wrappedTransaction
		.insert(eventSignup)
		.values({
			id: eventSignupId,
			organizationId,
			eventId,
			personId,
			details: detailsToPersist,
			status: 'incomplete',
			createdAt: new Date(),
			updatedAt: new Date()
		})
		.onConflictDoNothing()
		.returning();
	if (!inserted) {
		throw new Error('Unable to create incomplete event signup');
	}
	return inserted;
}

export async function completeEventSignupHelper({
	eventId,
	teamId,
	tx,
	personAction,
	signupDetails,
	organizationId,
	defaultEventSignupId
}: {
	tx: ServerTransaction;
	eventId: string;
	personAction: PersonActionHelper;
	signupDetails: EventSignupDetails;
	organizationId: string;
	teamId?: string;
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
		teamId,
		updateExistingPerson: true
	});

	return await completeEventSignupByPersonId({
		eventId,
		tx,
		personId: personRecord.id,
		organizationId,
		signupDetails,
		defaultEventSignupId: eventSignupId
	});
}

export async function completeEventSignupByPersonId({
	eventId,
	tx,
	personId,
	organizationId,
	signupDetails,
	defaultEventSignupId
}: {
	tx: ServerTransaction;
	eventId: string;
	personId: string;
	organizationId: string;
	signupDetails: EventSignupDetails;
	defaultEventSignupId?: string;
}) {
	const parsedSignupDetails = parse(eventSignupDetails, signupDetails);
	const eventRecord = await getEventByIdUnsafe({ eventId, organizationId, tx });
	if (!eventRecord.published) {
		throw new Error('Event is not published');
	}
	assertEventSignupWindowOpen(eventRecord);
	const completedStatus = resolveCompletedEventSignupStatus(eventRecord);

	const [existingEventSignup] = await tx.dbTransaction.wrappedTransaction
		.select()
		.from(eventSignup)
		.where(
			and(
				eq(eventSignup.eventId, eventId),
				eq(eventSignup.personId, personId),
				eq(eventSignup.organizationId, organizationId)
			)
		)
		.limit(1);

	const eventSignupId = existingEventSignup?.id || defaultEventSignupId || uuidv7();
	const detailsToPersist = existingEventSignup
		? mergeSignupDetails(existingEventSignup.details, parsedSignupDetails)
		: parsedSignupDetails;
	const previousStatus = existingEventSignup?.status;
	const nextStatus =
		previousStatus === 'attended' || previousStatus === 'noshow' ? previousStatus : completedStatus;

	let result: typeof eventSignup.$inferSelect | undefined;
	if (existingEventSignup) {
		const [updated] = await tx.dbTransaction.wrappedTransaction
			.update(eventSignup)
			.set({
				status: nextStatus,
				details: detailsToPersist,
				updatedAt: new Date()
			})
			.where(eq(eventSignup.id, existingEventSignup.id))
			.returning();
		result = updated;
	} else {
		const [inserted] = await tx.dbTransaction.wrappedTransaction
			.insert(eventSignup)
			.values({
				id: eventSignupId,
				organizationId,
				eventId,
				personId,
				details: detailsToPersist,
				status: nextStatus,
				createdAt: new Date(),
				updatedAt: new Date()
			})
			.onConflictDoNothing()
			.returning();
		result = inserted;
	}

	if (!result) {
		throw new Error('Unable to complete event signup');
	}

	const transitionedToComplete =
		!isCompleteEventSignupStatus(previousStatus) && isCompleteEventSignupStatus(result.status);
	if (transitionedToComplete) {
		const queue = await getQueue();
		await queue.insertActivity({
			organizationId,
			personId,
			userId: undefined,
			type: result.status === 'attended' ? 'event_attended' : 'event_signup',
			referenceId: result.id,
			unread: false
		});
	}

	return result;
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
	assertEventSignupWindowOpen(eventRecord);
	const [existingEventSignup] = await tx.dbTransaction.wrappedTransaction
		.select()
		.from(eventSignup)
		.where(
			and(
				eq(eventSignup.eventId, eventRecord.id),
				eq(eventSignup.personId, personRecord.id),
				eq(eventSignup.organizationId, organizationRecord.id)
			)
		)
		.limit(1);
	const previousStatus = existingEventSignup?.status;
	const status = resolveCompletedEventSignupStatus(eventRecord);
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
	const transitionedToComplete =
		!isCompleteEventSignupStatus(previousStatus) &&
		isCompleteEventSignupStatus(insertedEventSignup.status);
	if (transitionedToComplete) {
		const queue = await getQueue();
		await queue.insertActivity({
			organizationId: organizationRecord.id,
			personId: personRecord.id,
			userId: undefined,
			type: insertedEventSignup.status === 'attended' ? 'event_attended' : 'event_signup',
			referenceId: insertedEventSignup.id,
			unread: false
		});
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
	// Do not assert signup window here: attendance can be recorded after the event ends.
	// New signups still go through signUpForEventUnsafe, which enforces the window.

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
	assertEventSignupWindowOpen(eventRecord);

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
	await applyAttendanceTagIfNeeded({
		tx,
		eventId: existing.eventId,
		personId: existing.personId,
		organizationId,
		newStatus: parsed,
		previousStatus
	});
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
	if (
		parsed.input.details.channel.type !== 'adminPanel' &&
		getEventHasEnded({
			...event,
			endsAt: new Date(event.endsAt),
			startsAt: new Date(event.startsAt),
			createdAt: new Date(event.createdAt),
			updatedAt: new Date(event.updatedAt),
			reminderSentAt: event.reminderSentAt ? new Date(event.reminderSentAt) : null,
			cancelledAt: event.cancelledAt ? new Date(event.cancelledAt) : null,
			deletedAt: event.deletedAt ? new Date(event.deletedAt) : null,
			archivedAt: event.archivedAt ? new Date(event.archivedAt) : null
		})
	) {
		throw new Error('Event signup period has ended');
	}
	const [existingEventSignup] = await tx.dbTransaction.wrappedTransaction
		.select()
		.from(eventSignup)
		.where(
			and(
				eq(eventSignup.eventId, parsed.metadata.eventId),
				eq(eventSignup.personId, parsed.metadata.personId),
				eq(eventSignup.organizationId, parsed.metadata.organizationId)
			)
		)
		.limit(1);

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

	const shouldLogCompleteActivity =
		!isCompleteEventSignupStatus(existingEventSignup?.status) &&
		isCompleteEventSignupStatus(parsed.input.status);
	let queue: Awaited<ReturnType<typeof getQueue>> | undefined;
	if (shouldLogCompleteActivity) {
		queue = await getQueue();
		await queue.insertActivity({
			organizationId: parsed.metadata.organizationId,
			personId: parsed.metadata.personId,
			userId: ctx.userId || undefined,
			type: parsed.input.status === 'attended' ? 'event_attended' : 'event_signup',
			referenceId: insertedEventSignup.id,
			unread: false
		});
	}

	if (parsed.input.details.channel.type === 'eventPage') {
		queue = queue || (await getQueue());
		await queue.sendEventRegistration({
			eventSignupId: insertedEventSignup.id,
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
	await applyAttendanceTagIfNeeded({
		tx,
		eventId: parsed.metadata.eventId,
		personId: parsed.metadata.personId,
		organizationId: parsed.metadata.organizationId,
		newStatus: parsed.input.status,
		previousStatus: undefined
	});

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
	// Declining / "not attending" is only valid while the signup window is open; noshow, cancelled,
	// attendance, etc. remain editable after the event ends.
	if (parsed.input.status === 'notattending') {
		const eventForWindow = await getEventByIdUnsafe({
			eventId: eventSignupRecord.eventId,
			organizationId: parsed.metadata.organizationId,
			tx
		});
		assertEventSignupWindowOpen(eventForWindow);
	}
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
	const transitionedToComplete =
		!isCompleteEventSignupStatus(eventSignupRecord.status as EventSignupStatus) &&
		isCompleteEventSignupStatus(args.input.status);
	if (transitionedToComplete) {
		const queue = await getQueue();
		await queue.insertActivity({
			organizationId: args.metadata.organizationId,
			personId: args.metadata.personId,
			userId: ctx.userId || undefined,
			type: args.input.status === 'attended' ? 'event_attended' : 'event_signup',
			referenceId: args.metadata.eventSignupId,
			unread: false
		});
	}
	await applyAttendanceTagIfNeeded({
		tx,
		eventId: eventSignupRecord.eventId,
		personId: eventSignupRecord.personId,
		organizationId: args.metadata.organizationId,
		newStatus: args.input.status,
		previousStatus
	});
}
