import { syncedQueryWithContext, type ExpressionBuilder } from '@rocicorp/zero';
import { builder, type Schema } from '$lib/zero/schema';
import type { QueryContext } from '$lib/zero/schema';
import type { Query } from '$lib/server/db/zeroDrizzle';
import { array, type InferOutput, object, optional, nullable } from 'valibot';
import { listFilter, parseSchema, uuid } from '$lib/schema/helpers';
import { eventSignupReadPermissions } from '$lib/zero/query/event_signup/permissions';
import { readEventSignupZero } from '$lib/schema/event-signup';

export const inputSchema = object({
	...listFilter.entries,
	eventId: optional(uuid)
});
export type ListEventSignupsInput = InferOutput<typeof inputSchema>;

export function listEventSignupsQuery({
	tx,
	ctx,
	input
}: {
	tx?: Query;
	ctx: QueryContext;
	input: ListEventSignupsInput;
}) {
	const zero = tx || builder;
	let q = zero.eventSignup
		.where((expr) => eventSignupReadPermissions(expr, ctx))
		.where('organizationId', '=', input.organizationId)
		.where((expr) => whereClause(expr, { filter: input }))
		.limit(input.pageSize || 50);
	if (input.startAfter) {
		q = q.start({ id: input.startAfter });
	}
	return q;
}

export const listEventSignups = syncedQueryWithContext(
	'listEventSignups',
	parseSchema(inputSchema),
	(ctx: QueryContext, filter) => {
		return listEventSignupsQuery({ ctx, input: filter });
	}
);

function whereClause(
	builder: ExpressionBuilder<Schema, 'eventSignup'>,
	{ filter }: { filter: ListEventSignupsInput }
) {
	const { and, exists, cmp } = builder;
	const filterArr: Array<ReturnType<typeof exists> | ReturnType<typeof cmp>> = [];
	if (filter.eventId) {
		filterArr.push(cmp('eventId', '=', filter.eventId!));
	}
	if (filter.teamId) {
		filterArr.push(
			exists('event', (e) => {
				return e.where('teamId', '=', filter.teamId!);
			})
		);
	}
	return filterArr.length > 0 ? and(...filterArr) : and();
}

export const outputSchema = array(readEventSignupZero);
