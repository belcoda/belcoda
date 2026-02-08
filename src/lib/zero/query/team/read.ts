import { defineQuery } from '@rocicorp/zero';
import { builder } from '$lib/zero/schema';
import type { QueryContext } from '$lib/zero/schema';
import type { Query } from '$lib/server/db/zeroDrizzle';
import { object, type InferOutput } from 'valibot';
import { uuid, parseSchema } from '$lib/schema/helpers';
import { teamReadPermissions } from '$lib/zero/query/team/permissions';
import { readTeamZero } from '$lib/schema/team';

export const inputSchema = object({
	teamId: uuid
});

export function readTeamQuery({
	tx,
	ctx,
	input
}: {
	tx?: Query;
	ctx: QueryContext;
	input: InferOutput<typeof inputSchema>;
}) {
	const zero = tx || builder;
	const q = zero.team
		.where('id', '=', input.teamId)
		.where((expr) => teamReadPermissions(expr, ctx))
		.one();
	return q;
}

export const readTeam = defineQuery(inputSchema, ({ ctx, args }) => {
	return readTeamQuery({ ctx, input: args });
});

export const outputSchema = readTeamZero;
