import { defineQuery } from '@rocicorp/zero';
import { builder } from '$lib/zero/schema';
import type { QueryContext } from '$lib/zero/schema';
import type { Query } from '$lib/server/db/zeroDrizzle';
import { object, type InferOutput } from 'valibot';
import { uuid, parseSchema } from '$lib/schema/helpers';
import { petitionSignatureReadPermissions } from '$lib/zero/query/petition_signature/permissions';
import { readPetitionSignatureRest } from '$lib/schema/petition/petition-signature';

export const inputSchema = object({
	petitionSignatureId: uuid
});

export function readPetitionSignatureQuery({
	tx,
	ctx,
	input
}: {
	tx?: Query;
	ctx: QueryContext;
	input: InferOutput<typeof inputSchema>;
}) {
	const zero = tx || builder;
	const q = zero.petitionSignature
		.where('id', '=', input.petitionSignatureId)
		.where((expr) => petitionSignatureReadPermissions(expr, ctx))
		.one();
	return q;
}

export const readPetitionSignature = defineQuery(inputSchema, ({ ctx, args }) => {
	return readPetitionSignatureQuery({ ctx, input: args });
});

export const outputSchema = readPetitionSignatureRest;
