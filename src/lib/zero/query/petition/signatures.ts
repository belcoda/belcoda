import { defineQuery } from '@rocicorp/zero';
import { builder } from '$lib/zero/schema';
import type { QueryContext } from '$lib/zero/schema';
import { array, object, type InferOutput } from 'valibot';
import { uuid } from '$lib/schema/helpers';
import { petitionSignatureReadPermissions } from './permissions.js';
import { readPetitionSignatureZero } from '$lib/schema/petition/petition-signature';

const inputSchema = object({
	petitionId: uuid
});

type Input = InferOutput<typeof inputSchema>;

export function listPetitionSignaturesQuery({ ctx, input }: { ctx: QueryContext; input: Input }) {
	const q = builder.petitionSignature
		.where('petitionId', '=', input.petitionId)
		.where((expr) => petitionSignatureReadPermissions(expr, ctx))
		.where('deletedAt', 'IS', null)
		.related('person')
		.orderBy('createdAt', 'desc');
	return q;
}

export const listPetitionSignatures = defineQuery(inputSchema, ({ ctx, args }) => {
	return listPetitionSignaturesQuery({ ctx, input: args });
});

export const outputSchema = array(readPetitionSignatureZero);
