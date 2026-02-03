import { syncedQueryWithContext, type ExpressionBuilder } from '@rocicorp/zero';
import { builder, type Schema } from '$lib/zero/schema';
import type { QueryContext } from '$lib/zero/schema';
import type { Query } from '$lib/server/db/zeroDrizzle';
import { array, type InferOutput, object, optional, boolean } from 'valibot';
import { listFilter, parseSchema, type ListFilter, uuid } from '$lib/schema/helpers';
import { emailFromSignatureReadPermissions } from '$lib/zero/query/email_from_signature/permissions';
import { readEmailFromSignatureZero } from '$lib/schema/email-from-signature';

export const inputSchema = object({
	...listFilter.entries,
	verified: optional(boolean())
});
export type ListEmailFromSignaturesInput = InferOutput<typeof inputSchema>;

export function listEmailFromSignaturesQuery({
	tx,
	ctx,
	input
}: {
	tx?: Query;
	ctx: QueryContext;
	input: InferOutput<typeof inputSchema>;
}) {
	const zero = tx || builder;
	let q = zero.emailFromSignature
		.where((expr) => emailFromSignatureReadPermissions(expr, ctx))
		.where('organizationId', '=', input.organizationId)
		.where((expr) => whereClause(expr, { filter: input }))
		.limit(input.pageSize || 50);
	if (input.startAfter) {
		q = q.start({ id: input.startAfter });
	}
	return q;
}

export const listEmailFromSignatures = syncedQueryWithContext(
	'listEmailFromSignatures',
	parseSchema(inputSchema),
	(ctx: QueryContext, filter) => {
		return listEmailFromSignaturesQuery({ ctx, input: filter });
	}
);

function whereClause(
	builder: ExpressionBuilder<Schema, 'emailFromSignature'>,
	{ filter }: { filter: ListEmailFromSignaturesInput }
) {
	const isDeleted = filter.isDeleted ?? false;
	const { and, cmp, cmpLit } = builder;
	const filterArr = [
		cmp('deletedAt', isDeleted ? 'IS NOT' : 'IS', null),
		cmp('id', 'NOT IN', filter.excludedIds)
	];
	if (filter.searchString && filter.searchString.length > 0) {
		filterArr.push(cmp('name', 'ILIKE', `%${filter.searchString}%`));
	}
	if (filter.verified) {
		filterArr.push(cmp('verified', '=', filter.verified));
	}
	return and(...filterArr);
}

export const outputSchema = array(readEmailFromSignatureZero);
