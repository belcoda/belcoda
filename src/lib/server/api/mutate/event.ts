import type { MutatorParams } from '$lib/zero/schema';
import type { Transaction } from '$lib/server/db/zeroDrizzle';

import {
	type CreateMutatorSchemaOutput,
	type UpdateMutatorSchemaOutput,
	updateEvent
} from '$lib/schema/event';
import { parse } from 'valibot';

import { person, organization, team, event } from '$lib/schema/drizzle';
import { eq, and } from 'drizzle-orm';
import { eventReadPermissions } from '$lib/zero/query/event/permissions';
import { teamReadPermissions } from '$lib/zero/query/team/permissions';
import { unsafeInsertActionCode } from './action_code';

export function createEvent(params: MutatorParams) {
	return async function (tx: Transaction, input: CreateMutatorSchemaOutput) {
		const [organizationRecord] = await tx.dbTransaction.wrappedTransaction
			.select()
			.from(organization)
			.where(eq(organization.id, input.metadata.organizationId))
			.limit(1);
		if (!organizationRecord) {
			throw new Error('Organization not found');
		}

		if (
			![...params.queryContext.adminOrgs, ...params.queryContext.ownerOrgs].includes(
				organizationRecord.id
			) &&
			!input.metadata.teamId
		) {
			throw new Error('You are not authorized to create an event in this organization');
		}

		if (input.metadata.teamId) {
			const [teamRecord] = await tx.dbTransaction.wrappedTransaction
				.select()
				.from(team)
				.where(eq(team.id, input.metadata.teamId))
				.limit(1);
			if (!teamRecord) {
				throw new Error('Team not found');
			}
			if (organizationRecord.id !== teamRecord.organizationId) {
				throw new Error('Team does not belong to organization');
			}
		}

		const eventToCreate: typeof event.$inferInsert = {
			...input.input,
			...(input.input.teamId ? { teamId: input.input.teamId } : {}),
			id: input.metadata.eventId,
			organizationId: input.metadata.organizationId,
			published: false,
			createdAt: new Date(),
			updatedAt: new Date()
		};

		await unsafeInsertActionCode(tx, {
			organizationId: input.metadata.organizationId,
			type: 'event_signup',
			referenceId: input.metadata.eventId
		});
		await unsafeInsertActionCode(tx, {
			organizationId: input.metadata.organizationId,
			type: 'event_attended',
			referenceId: input.metadata.eventId
		});

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
	return async function (tx: Transaction, input: UpdateMutatorSchemaOutput) {
		const eventRecord = await tx.query.event
			.where('id', '=', input.metadata.eventId)
			.where('organizationId', '=', input.metadata.organizationId)
			.where((expr) => eventReadPermissions(expr, params.queryContext))
			.one()
			.run();
		if (!eventRecord) {
			throw new Error('Event not found');
		}

		const parseUpdateParams = parse(updateEvent, input.input);

		await tx.dbTransaction.wrappedTransaction
			.update(event)
			.set({
				...parseUpdateParams,
				updatedAt: new Date()
			})
			.where(
				and(
					eq(event.id, input.metadata.eventId),
					eq(event.organizationId, input.metadata.organizationId)
				)
			);
	};
}
