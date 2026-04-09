import { defineQuery } from '@rocicorp/zero';
import { builder } from '$lib/zero/schema';
import type { QueryContext } from '$lib/zero/schema';
import { object, type InferOutput } from 'valibot';
import { uuid, parseSchema } from '$lib/schema/helpers';
import { eventReadPermissions } from '$lib/zero/query/event/permissions';
import { readEventRest } from '$lib/schema/event';

export const inputSchema = object({
	eventId: uuid
});

export function readEventQuery({
	ctx,
	input
}: {
	ctx: QueryContext;
	input: InferOutput<typeof inputSchema>;
}) {
	const q = builder.event
		.where('id', '=', input.eventId)
		.where('deletedAt', 'IS', null)
		.where((expr) => eventReadPermissions(expr, ctx))
		.one();
	return q;
}

export const readEvent = defineQuery(inputSchema, ({ ctx, args }) => {
	return readEventQuery({ ctx, input: { eventId: args.eventId } });
});

export const outputSchema = readEventRest;
