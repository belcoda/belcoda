import { defineQuery } from '@rocicorp/zero';
import { builder } from '$lib/zero/schema';
import type { QueryContext } from '$lib/zero/schema';
import type { Query } from '$lib/server/db/zeroDrizzle';
import { object, type InferOutput } from 'valibot';
import { uuid, parseSchema } from '$lib/schema/helpers';
import { eventSignupReadPermissions } from '$lib/zero/query/event_signup/permissions';
import { readEventSignupZero } from '$lib/schema/event-signup';

export const inputSchema = object({
	eventSignupId: uuid
});

export function readEventSignupQuery({
	tx,
	ctx,
	input
}: {
	tx?: Query;
	ctx: QueryContext;
	input: InferOutput<typeof inputSchema>;
}) {
	const zero = tx || builder;
	const q = zero.eventSignup
		.where('id', '=', input.eventSignupId)
		.where((expr) => eventSignupReadPermissions(expr, ctx))
		.one();
	return q;
}

export const readEventSignup = defineQuery(inputSchema, ({ ctx, args }) => {
	return readEventSignupQuery({ ctx, input: { eventSignupId: args.eventSignupId } });
});

export const outputSchema = readEventSignupZero;
