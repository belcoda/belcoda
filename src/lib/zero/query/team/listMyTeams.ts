import { defineQuery } from '@rocicorp/zero';
import { builder } from '$lib/zero/schema';
import type { QueryContext } from '$lib/zero/schema';
import { array, type InferOutput, object } from 'valibot';
import { parseSchema, uuid } from '$lib/schema/helpers';
import { teamReadPermissions } from '$lib/zero/query/team/permissions';
import { readTeamZero } from '$lib/schema/team';

export const inputSchema = object({
	userId: uuid,
	organizationId: uuid
});

export function listMyTeamsQuery({
	ctx,
	input
}: {
	ctx: QueryContext;
	input: InferOutput<typeof inputSchema>;
}) {
	let q = builder.team
		.where((expr) => teamReadPermissions(expr, ctx))
		.where('organizationId', '=', input.organizationId)
		.whereExists('user', (m) => {
			return m.where('userId', '=', input.userId);
		})
		.limit(500); //no pagination on this query
	return q;
}

export const listMyTeams = defineQuery(inputSchema, ({ ctx, args }) => {
	return listMyTeamsQuery({ ctx, input: args });
});

export const outputSchema = array(readTeamZero);
