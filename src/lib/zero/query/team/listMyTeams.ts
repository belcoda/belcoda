import { syncedQueryWithContext } from '@rocicorp/zero';
import { builder } from '$lib/zero/schema';
import type { QueryContext } from '$lib/zero/schema';
import type { Query } from '$lib/server/db/zeroDrizzle';
import { array, type InferOutput, object } from 'valibot';
import { parseSchema, uuid } from '$lib/schema/helpers';
import { teamReadPermissions } from '$lib/zero/query/team/permissions';
import { readTeamZero } from '$lib/schema/team';

export const inputSchema = object({
	userId: uuid,
	organizationId: uuid
});

export function listMyTeamsQuery({
	tx,
	ctx,
	input
}: {
	tx?: Query;
	ctx: QueryContext;
	input: InferOutput<typeof inputSchema>;
}) {
	const zero = tx || builder;
	let q = zero.team
		.where((expr) => teamReadPermissions(expr, ctx))
		.where('organizationId', '=', input.organizationId)
		.whereExists('user', (m) => {
			return m.where('userId', '=', input.userId);
		})
		.limit(500); //no pagination on this query
	return q;
}

export const listMyTeams = syncedQueryWithContext(
	'listMyTeams',
	parseSchema(inputSchema),
	(ctx: QueryContext, filter) => {
		return listMyTeamsQuery({ ctx, input: filter });
	}
);

export const outputSchema = array(readTeamZero);
