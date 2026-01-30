import { type PersonActionHelper, personActionHelper } from '$lib/schema/person';
import { type PersonAddedFrom, personAddedFrom } from '$lib/schema/person/meta';
import {
	type EventSignupDetails,
	eventSignupDetails,
	type EventSignupStatus,
	eventSignupStatus
} from '$lib/schema/event/settings';

import { parse } from 'valibot';

import { event, eventSignup, person, organization } from '$lib/schema/drizzle';
import { getOrganizationByIdUnsafe } from '$lib/server/api/data/organization';
import { eq, and } from 'drizzle-orm';
import type { Transaction } from '$lib/server/db/zeroDrizzle';
import { findOrCreatePerson } from '$lib/server/api/data/person/findOrCreate';
import { v7 as uuidv7 } from 'uuid';
import { getQueue } from '$lib/server/queue';
import { clampLocale } from '$lib/utils/language';
import { type SurveyQuestionResponse, surveyQuestionResponse } from '$lib/schema/survey/questions';

import { _getPersonByPhoneNumberUnsafe } from '$lib/server/api/data/person/person';
export async function getEventByIdUnsafe({
	eventId,
	organizationId,
	tx
}: {
	tx: Transaction;
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
	tx: Transaction;
	eventId: string;
	organizationId: string;
}) {
	const eventSignups = await tx.dbTransaction.wrappedTransaction
		.select()
		.from(eventSignup)
		.where(and(eq(eventSignup.eventId, eventId), eq(eventSignup.organizationId, organizationId)));
	return eventSignups;
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
	tx: Transaction;
	eventId: string;
	personAction: PersonActionHelper;
	signupDetails: EventSignupDetails;
	organizationId: string;
	teamId?: string;
	skipMaxSignupsCheck?: boolean;
	skipNotifications?: boolean;
	defaultEventSignupId?: string;
}) {
	const parsedSignupDetails = parse(eventSignupDetails, signupDetails);
	const parsedActionHelper = parse(personActionHelper, personAction);

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
	tx: Transaction;
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
	tx: Transaction;
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

export async function getEventSignup({
	personId,
	eventId,
	organizationId,
	tx
}: {
	personId: string;
	eventId: string;
	organizationId: string;
	tx: Transaction;
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
	tx: Transaction;
}) {
	const parsed = parse(eventSignupStatus, status);
	const result = await tx.dbTransaction.wrappedTransaction
		.update(eventSignup)
		.set({ status: parsed })
		.where(and(eq(eventSignup.id, eventSignupId), eq(eventSignup.organizationId, organizationId)))
		.returning();
	if (!result) {
		throw new Error('Unable to update event signup');
	}
	return result;
}
