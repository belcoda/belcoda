import { defineQuery, type ExpressionBuilder } from '@rocicorp/zero';
import { builder, type Schema, type QueryContext } from '$lib/zero/schema';
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

function listTagsRestQueryBase({
	ctx,
	input,
	limit
}: {
	ctx: QueryContext;
	input: InferOutput<typeof inputSchema>;
	limit: number;
}) {
	let q = builder.tag
		.where((expr) => tagReadPermissions(expr, ctx))
		.where('organizationId', '=', input.organizationId)
		.where((expr) => whereClause(expr, { filter: input }))
		.orderBy('id', 'desc')
		.limit(limit);
	if (input.cursor) {
		const start = decodeRestTagListCursor(input.cursor);
		if (start) {
			q = q.start(start);
		}
	}
	return q;
}

function listTagsUiQueryBase({
	ctx,
	input,
	limit
}: {
	ctx: QueryContext;
	input: InferOutput<typeof inputSchema>;
	limit: number;
}) {
	let q = builder.tag
		.where((expr) => tagReadPermissions(expr, ctx))
		.where('organizationId', '=', input.organizationId)
		.where((expr) => whereClause(expr, { filter: input }))
		.orderBy('createdAt', 'desc')
		.orderBy('id', 'desc')
		.limit(limit);
	if (input.cursor) {
		const start = decodeTagListCursor(input.cursor);
		if (start) {
			q = q.start(start);
		}
	}
	return q;
}

/** Exact page size for REST callers. Sorts by id only to match the { id } REST cursor. */
export function listTagsQuery({
	ctx,
	input
}: {
	ctx: QueryContext;
	input: InferOutput<typeof inputSchema>;
}) {
	const pageSize = input.pageSize || 50;
	return listTagsRestQueryBase({ ctx, input, limit: pageSize });
}

/**
 * Zero client pagination: fetches one row past `pageSize` so `PaginatedZeroList` can detect
 * `hasMore` via `processPage` without a separate count query.
 * Sorts by createdAt + id to match the { createdAt, id } encoded cursor.
 */
export function listTagsPaginatedQuery({
	ctx,
	input
}: {
	ctx: QueryContext;
	input: InferOutput<typeof inputSchema>;
}) {
	const pageSize = input.pageSize || 50;
	return listTagsUiQueryBase({ ctx, input, limit: pageSize + 1 });
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
