import type { Transaction } from '$lib/server/db/zeroDrizzle';
import { type MutatorParams } from '$lib/zero/schema';

import { type CreateMutatorSchemaOutput } from '$lib/schema/event-signup';

export function createEventSignup(params: MutatorParams) {
	return async function (tx: Transaction, args: CreateMutatorSchemaOutput) {
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
	};
}
