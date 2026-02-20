import { defineQuery, type ExpressionBuilder } from '@rocicorp/zero';
import { builder, type Schema } from '$lib/zero/schema';
import type { QueryContext } from '$lib/zero/schema';
import { array, type InferOutput, object, optional } from 'valibot';
import { listFilter, parseSchema, uuid } from '$lib/schema/helpers';
import { petitionSignatureReadPermissions } from '$lib/zero/query/petition_signature/permissions';
import { readPetitionSignatureZero } from '$lib/schema/petition/petition-signature';

export const inputSchema = object({
	...listFilter.entries,
	petitionId: optional(uuid),
	personId: optional(uuid)
});
export type PetitionSignatureListFilter = InferOutput<typeof inputSchema>;

export function listPetitionSignaturesQuery({
	ctx,
	input
}: {
	ctx: QueryContext;
	input: InferOutput<typeof inputSchema>;
}) {
	let q = builder.petitionSignature
		.related('person')
		.where((expr) => petitionSignatureReadPermissions(expr, ctx))
		.where('organizationId', '=', input.organizationId)
		.where((expr) => whereClause(expr, { filter: input }))
		.orderBy('createdAt', 'desc')
		.limit(input.pageSize || 50);
	if (input.startAfter) {
		q = q.start({ id: input.startAfter });
	}
	return q;
}

export const listPetitionSignatures = defineQuery(inputSchema, ({ ctx, args }) => {
	return listPetitionSignaturesQuery({ ctx, input: args });
});

function whereClause(
	builder: ExpressionBuilder<'petitionSignature', Schema>,
	{ filter }: { filter: InferOutput<typeof inputSchema> }
) {
	const { and, cmp } = builder;
	const filterArr: ReturnType<typeof cmp>[] = [];

	if (filter.petitionId) {
		filterArr.push(cmp('petitionId', '=', filter.petitionId!));
	}

	if (filter.personId) {
		filterArr.push(cmp('personId', '=', filter.personId!));
	}

	if (filter.teamId) {
		filterArr.push(cmp('teamId', '=', filter.teamId!));
	}

	// Return and() with all filters, or just return and() with no args if no filters
	return filterArr.length > 0 ? and(...filterArr) : and();
}

export const outputSchema = array(readPetitionSignatureZero);
