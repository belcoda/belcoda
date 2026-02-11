import { type Transaction } from '@rocicorp/zero';
import { type Schema } from '$lib/zero/schema';
import { defineMutator } from '@rocicorp/zero';
import { createMutatorSchema, updateMutatorSchema } from '$lib/schema/event-signup';

export const createEventSignup = defineMutator(createMutatorSchema, async ({ tx, args, ctx }) => {
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
});

export const updateEventSignup = defineMutator(updateMutatorSchema, async ({ tx, args, ctx }) => {
	tx.mutate.eventSignup.update({
		id: args.metadata.eventSignupId,
		status: args.input.status,
		updatedAt: new Date().getTime()
	});
});
