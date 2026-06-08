import { defineQuery, type ExpressionBuilder } from '@rocicorp/zero';
import { builder, type Schema } from '$lib/zero/schema';
import type { QueryContext } from '$lib/zero/schema';
import { array, type InferOutput, object, optional, nullable, boolean } from 'valibot';
import { listFilter, uuid } from '$lib/schema/helpers';
import { tagReadPermissions } from '$lib/zero/query/tag/permissions';
import { readTagZero } from '$lib/schema/tag';
import { decodeRestTagListCursor, decodeTagListCursor } from '$lib/utils/tag/cursor';

export const inputSchema = object({
	...listFilter.entries,
	personId: optional(nullable(uuid)),
	includeInactive: optional(boolean())
});
export type ListTagsInput = InferOutput<typeof inputSchema>;

type TagListStartCursor = { createdAt: number; id: string } | { id: string };

function listTagsQueryBase({
	ctx,
	input,
	limit,
	resolveStartCursor
}: {
	ctx: QueryContext;
	input: InferOutput<typeof inputSchema>;
	limit: number;
	resolveStartCursor: (cursor: string) => TagListStartCursor | null;
}) {
	let q = builder.tag
		.where((expr) => tagReadPermissions(expr, ctx))
		.where('organizationId', '=', input.organizationId)
		.where((expr) => whereClause(expr, { filter: input }))
		.orderBy('createdAt', 'desc')
		.orderBy('id', 'desc')
		.limit(limit);
	if (input.cursor) {
		const start = resolveStartCursor(input.cursor);
		if (start) {
			q = q.start(start);
		}
	}
	return q;
}

/** Exact page size for REST and other non-UI callers. */
export function listTagsQuery({
	ctx,
	input
}: {
	ctx: QueryContext;
	input: InferOutput<typeof inputSchema>;
}) {
	const pageSize = input.pageSize || 50;
	return listTagsQueryBase({
		ctx,
		input,
		limit: pageSize,
		resolveStartCursor: decodeRestTagListCursor
	});
}

/**
 * Zero client pagination: fetches one row past `pageSize` so `PaginatedZeroList` can detect
 * `hasMore` via `processPage` without a separate count query.
 */
export function listTagsPaginatedQuery({
	ctx,
	input
}: {
	ctx: QueryContext;
	input: InferOutput<typeof inputSchema>;
}) {
	const pageSize = input.pageSize || 50;
	return listTagsQueryBase({
		ctx,
		input,
		limit: pageSize + 1,
		resolveStartCursor: decodeTagListCursor
	});
}

export const listTags = defineQuery(inputSchema, ({ ctx, args }) => {
	return listTagsPaginatedQuery({ ctx, input: args });
});

function whereClause(
	builder: ExpressionBuilder<'tag', Schema>,
	{ filter }: { filter: ListTagsInput }
) {
	const isDeleted = filter.isDeleted ?? false;
	const { and, cmp, exists } = builder;
	const filterArr = [cmp('deletedAt', isDeleted ? 'IS NOT' : 'IS', null)];
	if (!filter.includeInactive) {
		filterArr.push(cmp('active', '=', true));
	}
	if (filter.excludedIds.length > 0) {
		filterArr.push(cmp('id', 'NOT IN', filter.excludedIds));
	}
	if (filter.searchString && filter.searchString.length > 0) {
		filterArr.push(cmp('name', 'ILIKE', `%${filter.searchString}%`));
	}
	if (filter.personId) {
		filterArr.push(
			exists('personTags', (pt) => {
				return pt.where('personId', '=', filter.personId!);
			})
		);
	}
	return and(...filterArr);
}

export const outputSchema = array(readTagZero);
