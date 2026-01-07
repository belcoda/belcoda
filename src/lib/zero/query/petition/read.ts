import { syncedQueryWithContext } from '@rocicorp/zero';
import { builder } from '$lib/zero/schema';
import type { QueryContext } from '$lib/zero/schema';
import type { Query } from '$lib/server/db/zeroDrizzle';
import { object, type InferOutput } from 'valibot';
import { uuid, parseSchema } from '$lib/schema/helpers';
import { petitionReadPermissions } from '$lib/zero/query/petition/permissions';
import { readPetitionRest } from '$lib/schema/petition/petition';

export const inputSchema = object({
	petitionId: uuid
});

export function readPetitionQuery({
	tx,
	ctx,
	input
}: {
	tx?: Query;
	ctx: QueryContext;
	input: InferOutput<typeof inputSchema>;
}) {
	const zero = tx || builder;
	const q = zero.petition
		.where('id', '=', input.petitionId)
		.where((expr) => petitionReadPermissions(expr, ctx))
		.one();
	return q;
}

export const readPetition = syncedQueryWithContext(
	'readPetition',
	parseSchema(inputSchema),
	(ctx: QueryContext, { petitionId }) => {
		return readPetitionQuery({ ctx, input: { petitionId } });
	}
);

export const outputSchema = readPetitionRest;
