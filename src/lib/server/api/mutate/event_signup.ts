import type { Transaction } from '$lib/server/db/zeroDrizzle';
import { type MutatorParams } from '$lib/zero/schema';

import { type CreateMutatorSchemaOutput } from '$lib/schema/event-signup';
import { getQueue } from '$lib/server/queue';

import { organizationReadPermissions } from '$lib/zero/query/organizations/permissions';
import { personReadPermissions } from '$lib/zero/query/person/permissions';
import { eventReadPermissions } from '$lib/zero/query/event/permissions';
import { clampLocale } from '$lib/utils/language';
export function createEventSignup(params: MutatorParams) {
	return async function (tx: Transaction, args: CreateMutatorSchemaOutput) {
		const organization = await tx.query.organization
			.where((expr) => organizationReadPermissions(expr, params.queryContext))
			.where('id', args.metadata.organizationId)
			.one()
			.run();
		if (!organization) {
			throw new Error('Organization not found');
		}
		const person = await tx.query.person
			.where((expr) => personReadPermissions(expr, params.queryContext))
			.where('id', args.metadata.personId)
			.one()
			.run();
		if (!person) {
			throw new Error('Person not found');
		}
		const event = await tx.query.event
			.where((expr) => eventReadPermissions(expr, params.queryContext))
			.where('id', args.metadata.eventId)
			.one()
			.run();
		if (!event) {
			throw new Error('Event not found');
		}
		tx.mutate.eventSignup.insert({
			id: args.metadata.eventSignupId,
			organizationId: args.metadata.organizationId,
			eventId: args.metadata.eventId,
			personId: args.metadata.personId,
			details: args.input.details,
			status: args.input.status,
			createdAt: new Date().getTime(),
			updatedAt: new Date().getTime()
		});
		const queue = await getQueue();
		params.asyncTasks.push(async () => {
			await queue.insertActivity({
				organizationId: args.metadata.organizationId,
				personId: args.metadata.personId,
				userId: params.queryContext.userId || undefined,
				type: 'event_signup',
				referenceId: args.metadata.eventSignupId,
				unread: false
			});
		});
		if (args.input.details.channel.type === 'eventPage') {
			params.asyncTasks.push(async () => {
				await queue.sendEventRegistration({
					eventSignupId: args.metadata.eventSignupId,
					locale: clampLocale(person.preferredLanguage || organization.defaultLanguage)
				});
			});
		}
	};
}
