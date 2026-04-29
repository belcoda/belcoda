import { defineQuery, type ExpressionBuilder } from '@rocicorp/zero';
import { builder, type Schema } from '$lib/zero/schema';
import type { QueryContext } from '$lib/zero/schema';
import { object, type InferOutput } from 'valibot';
import { listFilter, uuid } from '$lib/schema/helpers';
import { personTagReadPermissions } from '$lib/zero/query/person_tag/permissions';

export const inputSchema = object({
	organizationId: listFilter.entries.organizationId,
	searchString: listFilter.entries.searchString,
	startAfter: listFilter.entries.startAfter,
	pageSize: listFilter.entries.pageSize,
	personId: uuid
});
export type ListPersonTagsInput = InferOutput<typeof inputSchema>;

export function listPersonTagsQuery({
	ctx,
	input
}: {
	ctx: QueryContext;
	input: InferOutput<typeof inputSchema>;
}) {
	return builder.personTag
		.where((expr) => personTagReadPermissions(expr, ctx))
		.related('tag', (expr) => expr.one())
		.where('organizationId', '=', input.organizationId)
		.where((expr) => whereClause(expr, { filter: input }))
		.orderBy('createdAt', 'desc')
		.limit(input.pageSize || 50);
}

export const listPersonTags = defineQuery(inputSchema, ({ ctx, args }) => {
	return listPersonTagsQuery({ ctx, input: args });
});

function whereClause(
	builder: ExpressionBuilder<'personTag', Schema>,
	{ filter }: { filter: ListPersonTagsInput }
) {
	const { and, cmp, exists } = builder;
	const filterArr = [cmp('personId', '=', filter.personId)];
	if (filter.searchString && filter.searchString.length > 0) {
		filterArr.push(
			exists('tag', (tg) => {
				return tg.where(({ cmp: c }) => c('name', 'ILIKE', `%${filter.searchString}%`));
			})
		);
	}
	return and(...filterArr);
}
