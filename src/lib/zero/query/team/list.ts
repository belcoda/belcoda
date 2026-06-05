import { defineQuery, type ExpressionBuilder } from '@rocicorp/zero';
import { builder, type Schema } from '$lib/zero/schema';
import type { QueryContext } from '$lib/zero/schema';
import { array, type InferOutput, object, optional, nullable } from 'valibot';
import { listFilter, type ListFilter, uuid } from '$lib/schema/helpers';
import { teamReadPermissions } from '$lib/zero/query/team/permissions';
import { readTeamZero } from '$lib/schema/team';
import { decodeTeamListCursor } from '$lib/utils/team/cursor';

export const inputSchema = object({
	...listFilter.entries,
	personId: optional(nullable(uuid))
});
export type ListTeamsInput = InferOutput<typeof inputSchema>;

function listTeamsQueryBase({
	ctx,
	input,
	limit
}: {
	ctx: QueryContext;
	input: InferOutput<typeof inputSchema>;
	limit: number;
}) {
	let q = builder.team
		.where((expr) => teamReadPermissions(expr, ctx))
		.where('organizationId', '=', input.organizationId)
		.where((expr) => whereClause(expr, { filter: input }))
		.orderBy('createdAt', 'desc')
		.orderBy('id', 'desc')
		.limit(limit);
	if (input.cursor) {
		const cursor = decodeTeamListCursor(input.cursor);
		if (cursor) {
			q = q.start(cursor);
		}
	}
	return q;
}

/** Exact page size for REST and other non-UI callers. */
export function listTeamsQuery({
	ctx,
	input
}: {
	ctx: QueryContext;
	input: InferOutput<typeof inputSchema>;
}) {
	const pageSize = input.pageSize || 50;
	return listTeamsQueryBase({ ctx, input, limit: pageSize });
}

/**
 * Zero client pagination: fetches one row past `pageSize` so `PaginatedZeroList` can detect
 * `hasMore` via `processPage` without a separate count query.
 */
export function listTeamsPaginatedQuery({
	ctx,
	input
}: {
	ctx: QueryContext;
	input: InferOutput<typeof inputSchema>;
}) {
	const pageSize = input.pageSize || 50;
	return listTeamsQueryBase({ ctx, input, limit: pageSize + 1 });
}

export const listTeams = defineQuery(inputSchema, ({ ctx, args }) => {
	return listTeamsPaginatedQuery({ ctx, input: args });
});

function whereClause(
	builder: ExpressionBuilder<'team', Schema>,
	{ filter }: { filter: ListTeamsInput }
) {
	const isDeleted = filter.isDeleted ?? false;
	const { and, cmp, exists } = builder;
	const filterArr = [
		cmp('deletedAt', isDeleted ? 'IS NOT' : 'IS', null),
		cmp('id', 'NOT IN', filter.excludedIds)
	];
	if (filter.searchString && filter.searchString.length > 0) {
		filterArr.push(cmp('name', 'ILIKE', `%${filter.searchString}%`));
	}
	if (filter.personId) {
		filterArr.push(
			exists('people', (pt) => {
				return pt.where('id', '=', filter.personId!);
			})
		);
	}
	return and(...filterArr);
}

export const outputSchema = array(readTeamZero);
