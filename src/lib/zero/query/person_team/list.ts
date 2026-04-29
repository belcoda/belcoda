import { defineQuery, type ExpressionBuilder } from '@rocicorp/zero';
import { builder, type Schema } from '$lib/zero/schema';
import type { QueryContext } from '$lib/zero/schema';
import { object, type InferOutput } from 'valibot';
import { listFilter, uuid } from '$lib/schema/helpers';
import { personTeamReadPermissions } from '$lib/zero/query/person_team/permissions';

export const inputSchema = object({
	organizationId: listFilter.entries.organizationId,
	searchString: listFilter.entries.searchString,
	startAfter: listFilter.entries.startAfter,
	pageSize: listFilter.entries.pageSize,
	personId: uuid
});
export type ListPersonTeamsInput = InferOutput<typeof inputSchema>;

export function listPersonTeamsQuery({
	ctx,
	input
}: {
	ctx: QueryContext;
	input: InferOutput<typeof inputSchema>;
}) {
	return builder.personTeam
		.where((expr) => personTeamReadPermissions(expr, ctx))
		.related('team', (expr) => expr.one())
		.where('organizationId', '=', input.organizationId)
		.where((expr) => whereClause(expr, { filter: input }))
		.orderBy('createdAt', 'desc')
		.limit(input.pageSize || 50);
}

export const listPersonTeams = defineQuery(inputSchema, ({ ctx, args }) => {
	return listPersonTeamsQuery({ ctx, input: args });
});

function whereClause(
	builder: ExpressionBuilder<'personTeam', Schema>,
	{ filter }: { filter: ListPersonTeamsInput }
) {
	const { and, cmp, exists } = builder;
	const filterArr = [cmp('personId', '=', filter.personId)];
	if (filter.searchString && filter.searchString.length > 0) {
		filterArr.push(
			exists('team', (tm) => {
				return tm.where(({ cmp: c }) => c('name', 'ILIKE', `%${filter.searchString}%`));
			})
		);
	}
	return and(...filterArr);
}
