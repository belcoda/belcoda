import { defineQuery } from '@rocicorp/zero';
import { builder } from '$lib/zero/schema';
import type { QueryContext } from '$lib/zero/schema';
import { object, type InferOutput } from 'valibot';
import { uuid, parseSchema } from '$lib/schema/helpers';
import { eventSignupReadPermissions } from '$lib/zero/query/event_signup/permissions';
import { readEventSignupZero } from '$lib/schema/event-signup';

export const inputSchema = object({
	eventSignupId: uuid
});

export function readEventSignupQuery({
	ctx,
	input
}: {
	ctx: QueryContext;
	input: InferOutput<typeof inputSchema>;
}) {
	const q = builder.eventSignup
		.where('id', '=', input.eventSignupId)
		.where((expr) => eventSignupReadPermissions(expr, ctx))
		.one();
	return q;
}

export const readEventSignup = defineQuery(inputSchema, ({ ctx, args }) => {
	return readEventSignupQuery({ ctx, input: { eventSignupId: args.eventSignupId } });
});

export const outputSchema = readEventSignupZero;
