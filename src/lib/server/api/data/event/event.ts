import { drizzle } from '$lib/server/db';
import { eq, and, isNull, sql } from 'drizzle-orm';
import { event, eventSignup, team } from '$lib/schema/drizzle';
import type { ServerTransaction } from '@rocicorp/zero';
import { type QueryContext, builder } from '$lib/zero/schema';
import { organizationReadPermissions } from '$lib/zero/query/organizations/permissions';
import {
	createEventZeroMutatorSchema,
	type CreateEventZeroMutatorSchemaOutput,
	updateEventZeroMutatorSchema,
	type UpdateEventZeroMutatorSchemaOutput,
	deleteEventMutatorSchemaZero,
	type DeleteEventMutatorSchemaZero,
	archiveEventMutatorSchemaZero,
	type ArchiveEventMutatorSchemaZero
} from '$lib/schema/event';
import { eventWebhook } from '$lib/schema/event';
import { eventSignupWebhook } from '$lib/schema/event-signup';
import { eventReadPermissions } from '$lib/zero/query/event/permissions';
import { eventDeletedWebhookSchema } from '$lib/schema/webhook';
import { parse } from 'valibot';
import { _insertActionCodeUnsafe } from '$lib/server/api/data/action/insert';
import { getQueue } from '$lib/server/queue';
import pino from '$lib/pino';
const log = pino(import.meta.url);

export async function createEvent({
	tx,
	ctx,
	args
}: {
	tx: ServerTransaction;
	ctx: QueryContext;
	args: CreateEventZeroMutatorSchemaOutput;
}) {
	const parsedInput = parse(createEventZeroMutatorSchema, args);
	const organizationRecord = await tx.run(
		builder.organization
			.where('id', parsedInput.metadata.organizationId)
			.where((expr) => organizationReadPermissions(expr, ctx))
			.one()
	);
	if (!organizationRecord) {
		throw new Error('Organization not found');
	}

	if (parsedInput.input.teamId) {
		const [teamRecord] = await tx.dbTransaction.wrappedTransaction
			.select()
			.from(team)
			.where(eq(team.id, parsedInput.input.teamId))
			.limit(1);
		if (!teamRecord) {
			throw new Error('Team not found');
		}
		if (organizationRecord.id !== teamRecord.organizationId) {
			throw new Error('Team does not belong to organization');
		}
	}

	const eventToCreate: typeof event.$inferInsert = {
		...parsedInput.input,
		...(parsedInput.input.teamId ? { teamId: parsedInput.input.teamId } : {}),
		id: parsedInput.metadata.eventId,
		organizationId: parsedInput.metadata.organizationId,
		published: false,
		startsAt: new Date(parsedInput.input.startsAt),
		endsAt: new Date(parsedInput.input.endsAt),
		createdAt: new Date(),
		updatedAt: new Date()
	};
	await _insertActionCodeUnsafe({
		tx,
		args: {
			organizationId: parsedInput.metadata.organizationId,
			type: 'event_signup',
			referenceId: parsedInput.metadata.eventId
		}
	});
	await _insertActionCodeUnsafe({
		tx,
		args: {
			organizationId: parsedInput.metadata.organizationId,
			type: 'event_attended',
			referenceId: parsedInput.metadata.eventId
		}
	});
	async function getNextSlug(slug: string, count: number = 0): Promise<string> {
		const slugToCheck = `${slug}${count > 0 ? `-${count}` : ''}`;
		const result = await tx.dbTransaction.wrappedTransaction.query.event.findFirst({
			where: and(
				eq(event.organizationId, parsedInput.metadata.organizationId),
				eq(event.slug, slugToCheck),
				isNull(event.deletedAt)
			)
		});
		if (result) {
			return await getNextSlug(slug, count + 1);
		}
		return slugToCheck;
	}
	async function getNextTitle(title: string, count: number = 0): Promise<string> {
		const titleToCheck = `${title}${count > 0 ? ` ${count}` : ''}`;
		const result = await tx.dbTransaction.wrappedTransaction.query.event.findFirst({
			where: and(
				eq(event.organizationId, parsedInput.metadata.organizationId),
				eq(event.title, titleToCheck),
				isNull(event.deletedAt)
			)
		});
		if (result) {
			return await getNextTitle(title, count + 1);
		}
		return titleToCheck;
	}
	const uniqueSlug = await getNextSlug(eventToCreate.slug);
	const uniqueTitle = await getNextTitle(eventToCreate.title);
	eventToCreate.slug = uniqueSlug;
	eventToCreate.title = uniqueTitle;
	const [result] = await tx.dbTransaction.wrappedTransaction
		.insert(event)
		.values(eventToCreate)
		.returning();
	if (!result) {
		throw new Error('Unable to create event');
	}
	try {
		const queue = await getQueue();
		await queue.triggerWebhook({
			organizationId: parsedInput.metadata.organizationId,
			payload: {
				type: 'event.created',
				data: parse(eventWebhook, result)
			}
		});
	} catch (err) {
		log.error({ err }, 'Failed to trigger webhook');
	}
	return result;
}

export async function updateEvent({
	tx,
	ctx,
	args
}: {
	tx: ServerTransaction;
	ctx: QueryContext;
	args: UpdateEventZeroMutatorSchemaOutput;
}) {
	const parsed = parse(updateEventZeroMutatorSchema, args);
	const eventRecord = await tx.run(
		builder.event
			.where('id', '=', parsed.metadata.eventId)
			.where('organizationId', '=', parsed.metadata.organizationId)
			.where((expr) => eventReadPermissions(expr, ctx))
			.one()
	);
	if (!eventRecord) {
		throw new Error('Event not found');
	}

	const [updatedEvent] = await tx.dbTransaction.wrappedTransaction
		.update(event)
		.set({
			...parsed.input,
			startsAt: parsed.input.startsAt ? new Date(parsed.input.startsAt) : undefined,
			endsAt: parsed.input.endsAt ? new Date(parsed.input.endsAt) : undefined,
			updatedAt: new Date()
		})
		.where(
			and(
				eq(event.id, parsed.metadata.eventId),
				eq(event.organizationId, parsed.metadata.organizationId)
			)
		)
		.returning();

	const structureChanged = !!(parsed.input.settings || parsed.input.title);
	const publishedStatusChanged =
		eventRecord?.published !== undefined && eventRecord?.published !== updatedEvent?.published;

	const queue = await getQueue();
	if (structureChanged || publishedStatusChanged) {
		queue.deployEventWhatsAppFlow({ eventId: updatedEvent.id });
	}

	try {
		await queue.triggerWebhook({
			organizationId: parsed.metadata.organizationId,
			payload: {
				type: 'event.updated',
				data: parse(eventWebhook, updatedEvent)
			}
		});
	} catch (err) {
		log.error({ err }, 'Failed to trigger webhook');
	}
}

export async function deleteEvent({
	tx,
	ctx,
	args
}: {
	tx: ServerTransaction;
	ctx: QueryContext;
	args: DeleteEventMutatorSchemaZero;
}) {
	const parsed = parse(deleteEventMutatorSchemaZero, args);
	const eventRecord = await tx.run(
		builder.event
			.where('id', '=', parsed.metadata.eventId)
			.where('organizationId', '=', parsed.metadata.organizationId)
			.where((expr) => eventReadPermissions(expr, ctx))
			.one()
	);
	if (!eventRecord) {
		throw new Error('Event not found');
	}

	if (eventRecord.published) {
		throw new Error('Cannot delete a published event. Archive it instead.');
	}

	const cancelledSignups = await tx.dbTransaction.wrappedTransaction
		.update(eventSignup)
		.set({ status: 'cancelled', updatedAt: new Date() })
		.where(
			and(
				eq(eventSignup.eventId, parsed.metadata.eventId),
				eq(eventSignup.organizationId, parsed.metadata.organizationId)
			)
		)
		.returning();

	const [result] = await tx.dbTransaction.wrappedTransaction
		.update(event)
		.set({ deletedAt: new Date(), updatedAt: new Date() })
		.where(
			and(
				eq(event.id, parsed.metadata.eventId),
				isNull(event.deletedAt),
				eq(event.organizationId, parsed.metadata.organizationId)
			)
		)
		.returning();

	const queue = await getQueue();
	const signupResults = await Promise.allSettled(
		cancelledSignups.map(async (row) => {
			const { organizationId: _omit, ...signupWebhookData } = row;
			await queue.triggerWebhook({
				organizationId: parsed.metadata.organizationId,
				payload: {
					type: 'event.signup.updated',
					data: parse(eventSignupWebhook, signupWebhookData)
				}
			});
		})
	);
	for (const result of signupResults) {
		if (result.status === 'rejected') {
			log.error({ err: result.reason }, 'Failed to trigger webhook');
		}
	}
	if (result) {
		try {
			await queue.triggerWebhook({
				organizationId: parsed.metadata.organizationId,
				payload: parse(eventDeletedWebhookSchema, {
					type: 'event.deleted',
					data: { eventId: parsed.metadata.eventId }
				})
			});
		} catch (err) {
			log.error({ err }, 'Failed to trigger webhook');
		}
	}
}

export async function archiveEvent({
	tx,
	ctx,
	args
}: {
	tx: ServerTransaction;
	ctx: QueryContext;
	args: ArchiveEventMutatorSchemaZero;
}) {
	const parsed = parse(archiveEventMutatorSchemaZero, args);
	const eventRecord = await tx.run(
		builder.event
			.where('id', '=', parsed.metadata.eventId)
			.where('organizationId', '=', parsed.metadata.organizationId)
			.where((expr) => eventReadPermissions(expr, ctx))
			.one()
	);
	if (!eventRecord) {
		throw new Error('Event not found');
	}

	if (!eventRecord.published) {
		throw new Error('Cannot archive a draft event. Delete it instead.');
	}

	const [archived] = await tx.dbTransaction.wrappedTransaction
		.update(event)
		.set({ archivedAt: new Date(), updatedAt: new Date() })
		.where(
			and(
				eq(event.id, parsed.metadata.eventId),
				eq(event.organizationId, parsed.metadata.organizationId)
			)
		)
		.returning();
	if (archived) {
		try {
			const queue = await getQueue();
			await queue.triggerWebhook({
				organizationId: parsed.metadata.organizationId,
				payload: {
					type: 'event.updated',
					data: parse(eventWebhook, archived)
				}
			});
		} catch (err) {
			log.error({ err }, 'Failed to trigger webhook');
		}
	}
}

export async function _getEventBySlugUnsafe({
	eventSlug,
	organizationId
}: {
	eventSlug: string;
	organizationId: string;
}) {
	const eventObject = await drizzle.query.event.findFirst({
		where: and(
			eq(event.slug, eventSlug),
			eq(event.organizationId, organizationId),
			isNull(event.deletedAt)
		)
	});
	return eventObject;
}

export async function _getEventByIdUnsafe({
	eventId,
	tx
}: {
	eventId: string;
	tx: ServerTransaction;
}) {
	const [eventObject] = await tx.dbTransaction.wrappedTransaction
		.select()
		.from(event)
		.where(and(eq(event.id, eventId), isNull(event.deletedAt)));
	if (!eventObject) {
		throw new Error('Event not found');
	}
	return eventObject;
}

/**
 * Loads an event by id without tenant or auth filters, returning null if missing.
 * For trusted server callsites only (e.g. path-based org inference). Selects
 * only organizationId to avoid loading full row when that is all that is needed.
 */
export async function _getEventByIdUnsafeNoTenantCheck({
	eventId,
	tx
}: {
	eventId: string;
	tx: ServerTransaction;
}): Promise<{ organizationId: string } | null> {
	const [row] = await tx.dbTransaction.wrappedTransaction
		.select({ organizationId: event.organizationId })
		.from(event)
		.where(and(eq(event.id, eventId), isNull(event.deletedAt)))
		.limit(1);
	return row ?? null;
}

export async function getEventById({
	eventId,
	ctx,
	tx
}: {
	eventId: string;
	ctx: QueryContext;
	tx: ServerTransaction;
}) {
	const eventRecord = await tx.run(
		builder.event
			.where('id', '=', eventId)
			.where((expr) => eventReadPermissions(expr, ctx))
			.one()
	);
	if (!eventRecord) {
		throw new Error('Event not found');
	}
	return eventRecord;
}
