import { syncedQueryWithContext, type ExpressionBuilder } from '@rocicorp/zero';
import { builder, type Schema } from '$lib/zero/schema';
import type { QueryContext } from '$lib/zero/schema';
import type { Query } from '$lib/server/db/zeroDrizzle';
import { array, type InferOutput, object, optional, nullable } from 'valibot';
import { listFilter, parseSchema, type ListFilter, uuid } from '$lib/schema/helpers';
import { tagReadPermissions } from '$lib/zero/query/tag/permissions';
import { readTagZero } from '$lib/schema/tag';

export const inputSchema = object({
	...listFilter.entries,
	personId: optional(nullable(uuid))
});
export type ListTagsInput = InferOutput<typeof inputSchema>;

export function listTagsQuery({
	tx,
	ctx,
	input
}: {
	tx?: Query;
	ctx: QueryContext;
	input: InferOutput<typeof inputSchema>;
}) {
	const zero = tx || builder;
	let q = zero.tag
		.where((expr) => tagReadPermissions(expr, ctx))
		.where('organizationId', '=', input.organizationId)
		.where((expr) => whereClause(expr, { filter: input }))
		.limit(input.pageSize || 50);
	if (input.startAfter) {
		q = q.start({ id: input.startAfter });
	}
	return q;
}

export const listTags = syncedQueryWithContext(
	'listTags',
	parseSchema(inputSchema),
	(ctx: QueryContext, filter) => {
		return listTagsQuery({ ctx, input: filter });
	}
);

function whereClause(
	builder: ExpressionBuilder<Schema, 'tag'>,
	{ filter }: { filter: ListTagsInput }
) {
	const isDeleted = filter.isDeleted ?? false;
	const { and, cmp, exists } = builder;
	const filterArr = [cmp('active', '=', !isDeleted), cmp('id', 'NOT IN', filter.excludedIds)];
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
