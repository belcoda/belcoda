import { defineQuery } from '@rocicorp/zero';
import { builder } from '$lib/zero/schema';
import type { QueryContext } from '$lib/zero/schema';
import { object, type InferOutput } from 'valibot';
import { uuid, parseSchema } from '$lib/schema/helpers';
import { petitionReadPermissions } from '$lib/zero/query/petition/permissions';
import { readPetitionRest } from '$lib/schema/petition/petition';

export const inputSchema = object({
	petitionId: uuid
});

export function readPetitionQuery({
	ctx,
	input
}: {
	ctx: QueryContext;
	input: InferOutput<typeof inputSchema>;
}) {
	const q = builder.petition
		.where('id', '=', input.petitionId)
		.where('deletedAt', 'IS', null)
		.where((expr) => petitionReadPermissions(expr, ctx))
		.one();
	return q;
}

export const readPetition = defineQuery(inputSchema, ({ ctx, args }) => {
	return readPetitionQuery({ ctx, input: args });
});

export const outputSchema = readPetitionRest;
