import { defineQuery } from '@rocicorp/zero';
import { builder } from '$lib/zero/schema';
import type { QueryContext } from '$lib/zero/schema';
import { object, type InferOutput } from 'valibot';
import { uuid, parseSchema } from '$lib/schema/helpers';
import { petitionSignatureReadPermissions } from '$lib/zero/query/petition_signature/permissions';
import { readPetitionSignatureRest } from '$lib/schema/petition/petition-signature';

export const inputSchema = object({
	petitionSignatureId: uuid
});

export function readPetitionSignatureQuery({
	ctx,
	input
}: {
	ctx: QueryContext;
	input: InferOutput<typeof inputSchema>;
}) {
	const q = builder.petitionSignature
		.where('id', '=', input.petitionSignatureId)
		.where((expr) => petitionSignatureReadPermissions(expr, ctx))
		.one();
	return q;
}

export const readPetitionSignature = defineQuery(inputSchema, ({ ctx, args }) => {
	return readPetitionSignatureQuery({ ctx, input: args });
});

export const outputSchema = readPetitionSignatureRest;
