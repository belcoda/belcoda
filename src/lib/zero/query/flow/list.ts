import { defineQuery, type ExpressionBuilder } from '@rocicorp/zero';
import { builder, type Schema, type QueryContext } from '$lib/zero/schema';
import { array, type InferOutput, object, nullable, optional, picklist } from 'valibot';
import { listFilter } from '$lib/schema/helpers';
import { flowReadPermissions } from '$lib/zero/query/flow/permissions';
import { readFlowResourceZero } from '$lib/schema/flow/flow';
import { decodeFlowListCursor } from '$lib/utils/flow/cursor';

export const inputSchema = object({
	...listFilter.entries,
	status: optional(nullable(picklist(['active', 'archived'])))
});
export type FlowListFilter = InferOutput<typeof inputSchema>;

function listFlowsQueryBase({
	ctx,
	input,
	limit
}: {
	ctx: QueryContext;
	input: InferOutput<typeof inputSchema>;
	limit: number;
}) {
	let q = builder.flow
		.where((expr) => flowReadPermissions(expr, ctx))
		.where('organizationId', '=', input.organizationId)
		.where((expr) => whereClause(expr, { filter: input }))
		.orderBy('createdAt', 'desc')
		.orderBy('id', 'desc')
		.limit(limit);
	if (input.cursor) {
		const cursor = decodeFlowListCursor(input.cursor);
		if (cursor) {
			q = q.start(cursor);
		}
	}
	return q;
}

/** Exact page size for REST and other non-UI callers. */
export function listFlowsQuery({
	ctx,
	input
}: {
	ctx: QueryContext;
	input: InferOutput<typeof inputSchema>;
}) {
	const pageSize = input.pageSize || 50;
	return listFlowsQueryBase({ ctx, input, limit: pageSize });
}

/**
 * Zero client pagination: fetches one row past `pageSize` so `PaginatedZeroList` can detect
 * `hasMore` via `processPage` without a separate count query.
 */
export function listFlowsPaginatedQuery({
	ctx,
	input
}: {
	ctx: QueryContext;
	input: InferOutput<typeof inputSchema>;
}) {
	const pageSize = input.pageSize || 50;
	return listFlowsQueryBase({ ctx, input, limit: pageSize + 1 });
}

export const listFlows = defineQuery(inputSchema, ({ ctx, args }) => {
	return listFlowsPaginatedQuery({ ctx, input: args });
});

function whereClause(
	builder: ExpressionBuilder<'flow', Schema>,
	{ filter }: { filter: InferOutput<typeof inputSchema> }
) {
	const isDeleted = filter.isDeleted ?? false;
	const { and, cmp } = builder;
	const filterArr = [cmp('deletedAt', isDeleted ? 'IS NOT' : 'IS', null)];

	if (filter.searchString && filter.searchString.length > 0) {
		filterArr.push(cmp('name', 'ILIKE', `%${filter.searchString}%`));
	}

	if (filter.teamId) {
		filterArr.push(cmp('teamId', '=', filter.teamId!));
	}

	if (filter.status === 'archived') {
		filterArr.push(cmp('archivedAt', 'IS NOT', null));
	} else if (filter.status === 'active') {
		filterArr.push(cmp('archivedAt', 'IS', null));
	}

	return and(...filterArr);
}

export const outputSchema = array(readFlowResourceZero);
