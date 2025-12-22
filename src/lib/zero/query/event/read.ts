import { syncedQueryWithContext } from '@rocicorp/zero';
import { builder } from '$lib/zero/schema';
import type { QueryContext } from '$lib/zero/schema';
import type { Query } from '$lib/server/db/zeroDrizzle';
import { object, type InferOutput } from 'valibot';
import { uuid, parseSchema } from '$lib/schema/helpers';
import { eventReadPermissions } from '$lib/zero/query/event/permissions';
import { readEventZero } from '$lib/schema/event';

export const inputSchema = object({
	eventId: uuid
});

export function readEventQuery({
	tx,
	ctx,
	input
}: {
	tx?: Query;
	ctx: QueryContext;
	input: InferOutput<typeof inputSchema>;
}) {
	const zero = tx || builder;
	const q = zero.event
		.where('id', '=', input.eventId)
		.where((expr) => eventReadPermissions(expr, ctx))
		.one();
	return q;
}

export const readEvent = syncedQueryWithContext(
	'readEvent',
	parseSchema(inputSchema),
	(ctx: QueryContext, { eventId }) => {
		return readEventQuery({ ctx, input: { eventId } });
	}
);

export const outputSchema = readEventZero;
