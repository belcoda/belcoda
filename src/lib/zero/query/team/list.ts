import { defineQuery, type ExpressionBuilder } from '@rocicorp/zero';
import { builder, type Schema } from '$lib/zero/schema';
import type { QueryContext } from '$lib/zero/schema';
import { array, type InferOutput, object, optional, nullable } from 'valibot';
import { listFilter, parseSchema, type ListFilter, uuid } from '$lib/schema/helpers';
import { teamReadPermissions } from '$lib/zero/query/team/permissions';
import { readTeamZero } from '$lib/schema/team';

export const inputSchema = object({
	...listFilter.entries,
	personId: optional(nullable(uuid))
});
export type ListTeamsInput = InferOutput<typeof inputSchema>;

export function listTeamsQuery({
	ctx,
	input
}: {
	ctx: QueryContext;
	input: InferOutput<typeof inputSchema>;
}) {
	let q = builder.team
		.where((expr) => teamReadPermissions(expr, ctx))
		.where('organizationId', '=', input.organizationId)
		.where((expr) => whereClause(expr, { filter: input }))
		.limit(input.pageSize || 50);
	if (input.startAfter) {
		q = q.start({ id: input.startAfter });
	}

	return q;
}

export const listTeams = defineQuery(inputSchema, ({ ctx, args }) => {
	return listTeamsQuery({ ctx, input: args });
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
