import { defineQuery, type ExpressionBuilder } from '@rocicorp/zero';
import { builder, type Schema } from '$lib/zero/schema';
import type { QueryContext } from '$lib/zero/schema';
import { array, type InferOutput, object, optional } from 'valibot';
import { listFilter, uuid } from '$lib/schema/helpers';
import { petitionSignatureReadPermissions } from '$lib/zero/query/petition_signature/permissions';
import { readPetitionSignatureZeroWithPerson } from '$lib/schema/petition/petition-signature';

export const inputSchema = object({
	...listFilter.entries,
	petitionId: optional(uuid),
	personId: optional(uuid)
});
export type PetitionSignatureListFilter = InferOutput<typeof inputSchema>;

const byPetitionInputSchema = object({
	petitionId: uuid
});
export type PetitionSignaturesByPetitionInput = InferOutput<typeof byPetitionInputSchema>;

export function listPetitionSignaturesQuery({
	ctx,
	input
}: {
	ctx: QueryContext;
	input: InferOutput<typeof inputSchema>;
}) {
	const pageSize = input.pageSize ?? (input.petitionId ? 10_000 : 50);
	let q = builder.petitionSignature
		.related('person')
		.where((expr) => petitionSignatureReadPermissions(expr, ctx))
		.where('organizationId', '=', input.organizationId)
		.where((expr) => whereClause(expr, { filter: input }))
		.orderBy('createdAt', 'desc')
		.limit(pageSize);
	if (input.startAfter) {
		q = q.start({ id: input.startAfter });
	}
	return q;
}

export function listPetitionSignaturesByPetitionQuery({
	ctx,
	input
}: {
	ctx: QueryContext;
	input: InferOutput<typeof byPetitionInputSchema>;
}) {
	return builder.petitionSignature
		.where('petitionId', '=', input.petitionId)
		.where((expr) => petitionSignatureReadPermissions(expr, ctx))
		.where('deletedAt', 'IS', null)
		.related('person')
		.orderBy('createdAt', 'desc');
}

export const listPetitionSignatures = defineQuery(inputSchema, ({ ctx, args }) => {
	return listPetitionSignaturesQuery({ ctx, input: args });
});

export const listPetitionSignaturesByPetition = defineQuery(
	byPetitionInputSchema,
	({ ctx, args }) => {
		return listPetitionSignaturesByPetitionQuery({ ctx, input: args });
	}
);

function whereClause(
	builder: ExpressionBuilder<'petitionSignature', Schema>,
	{ filter }: { filter: InferOutput<typeof inputSchema> }
) {
	const { and, cmp } = builder;
	const filterArr: ReturnType<typeof cmp>[] = [cmp('deletedAt', 'IS', null)];

	if (filter.petitionId) {
		filterArr.push(cmp('petitionId', '=', filter.petitionId!));
	}

	if (filter.personId) {
		filterArr.push(cmp('personId', '=', filter.personId!));
	}

	if (filter.teamId) {
		filterArr.push(cmp('teamId', '=', filter.teamId!));
	}

	return and(...filterArr);
}

export const outputSchema = array(readPetitionSignatureZeroWithPerson);
