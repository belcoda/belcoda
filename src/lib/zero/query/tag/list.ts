import { defineQuery, type ExpressionBuilder } from '@rocicorp/zero';
import { builder, type Schema } from '$lib/zero/schema';
import type { QueryContext } from '$lib/zero/schema';
import { array, type InferOutput, object, optional, nullable, boolean } from 'valibot';
import { listFilter, parseSchema, type ListFilter, uuid } from '$lib/schema/helpers';
import { tagReadPermissions } from '$lib/zero/query/tag/permissions';
import { readTagZero } from '$lib/schema/tag';

export const inputSchema = object({
	...listFilter.entries,
	personId: optional(nullable(uuid)),
	includeDeleted: optional(boolean())
});
export type ListTagsInput = InferOutput<typeof inputSchema>;

export function listTagsQuery({
	ctx,
	input
}: {
	ctx: QueryContext;
	input: InferOutput<typeof inputSchema>;
}) {
	let q = builder.tag
		.where((expr) => tagReadPermissions(expr, ctx))
		.where('organizationId', '=', input.organizationId)
		.where((expr) => whereClause(expr, { filter: input }))
		.limit(input.pageSize || 50);
	if (input.startAfter) {
		q = q.start({ id: input.startAfter });
	}
	return q;
}

export const listTags = defineQuery(inputSchema, ({ ctx, args }) => {
	return listTagsQuery({ ctx, input: args });
});

function whereClause(
	builder: ExpressionBuilder<'tag', Schema>,
	{ filter }: { filter: ListTagsInput }
) {
	const isDeleted = filter.isDeleted ?? false;
	const { and, cmp, exists } = builder;
	const filterArr = [];
	if (!filter.includeDeleted) {
		filterArr.push(cmp('active', '=', !isDeleted));
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
