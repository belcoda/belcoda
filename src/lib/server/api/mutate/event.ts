import type { MutatorParams } from '$lib/zero/schema';
import type { Transaction } from '$lib/server/db/zeroDrizzle';

import {
	type CreateEventZeroMutatorSchema,
	type UpdateEventZeroMutatorSchema,
	createEventZeroMutatorSchema,
	updateEventZeroMutatorSchema
} from '$lib/schema/event';
import { parse } from 'valibot';

import { person, organization, team, event } from '$lib/schema/drizzle';
import { eq, and } from 'drizzle-orm';
import { eventReadPermissions } from '$lib/zero/query/event/permissions';
import { teamReadPermissions } from '$lib/zero/query/team/permissions';
import { unsafeInsertActionCode } from './action_code';

export function createEvent(params: MutatorParams) {
	return async function (tx: Transaction, input: CreateEventZeroMutatorSchema) {
		const parsedInput = parse(createEventZeroMutatorSchema, input);
		const [organizationRecord] = await tx.dbTransaction.wrappedTransaction
			.select()
			.from(organization)
			.where(eq(organization.id, parsedInput.metadata.organizationId))
			.limit(1);
		if (!organizationRecord) {
			throw new Error('Organization not found');
		}

		if (
			![...params.queryContext.adminOrgs, ...params.queryContext.ownerOrgs].includes(
				organizationRecord.id
			) &&
			!parsedInput.metadata.teamId
		) {
			throw new Error('You are not authorized to create an event in this organization');
		}

		if (parsedInput.metadata.teamId) {
			const [teamRecord] = await tx.dbTransaction.wrappedTransaction
				.select()
				.from(team)
				.where(eq(team.id, parsedInput.metadata.teamId))
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
			createdAt: new Date(),
			updatedAt: new Date()
		};

		await unsafeInsertActionCode(tx, {
			organizationId: parsedInput.metadata.organizationId,
			type: 'event_signup',
			referenceId: parsedInput.metadata.eventId
		});
		await unsafeInsertActionCode(tx, {
			organizationId: parsedInput.metadata.organizationId,
			type: 'event_attended',
			referenceId: parsedInput.metadata.eventId
		});

		async function getNextSlug(slug: string, count: number = 0): Promise<string> {
			const slugToCheck = `${slug}${count > 0 ? `-${count}` : ''}`;
			const result = await tx.query.event
				.where('organizationId', '=', parsedInput.metadata.organizationId)
				.where('slug', '=', slugToCheck)
				.where('deletedAt', 'IS', null)
				.run({ type: 'complete' });
			if (result.length > 0) {
				return await getNextSlug(slug, count + 1);
			}
			return slugToCheck;
		}

		async function getNextTitle(title: string, count: number = 0): Promise<string> {
			const titleToCheck = `${title}${count > 0 ? ` ${count}` : ''}`;
			const result = await tx.query.event
				.where('organizationId', '=', parsedInput.metadata.organizationId)
				.where('title', '=', titleToCheck)
				.where('deletedAt', 'IS', null)
				.run({ type: 'complete' });
			if (result.length > 0) {
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

		params.result?.push(result);
	};
}

export function updateEvent(params: MutatorParams) {
	return async function (tx: Transaction, input: UpdateEventZeroMutatorSchema) {
		const parsed = parse(updateEventZeroMutatorSchema, input);
		const eventRecord = await tx.query.event
			.where('id', '=', parsed.metadata.eventId)
			.where('organizationId', '=', parsed.metadata.organizationId)
			.where((expr) => eventReadPermissions(expr, params.queryContext))
			.one()
			.run();
		if (!eventRecord) {
			throw new Error('Event not found');
		}

		await tx.dbTransaction.wrappedTransaction
			.update(event)
			.set({
				...parsed.input,
				updatedAt: new Date()
			})
			.where(
				and(
					eq(event.id, parsed.metadata.eventId),
					eq(event.organizationId, parsed.metadata.organizationId)
				)
			);
	};
}
