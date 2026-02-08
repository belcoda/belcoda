import { syncedQueryWithContext, type ExpressionBuilder } from '@rocicorp/zero';
import { builder } from '$lib/zero/schema';
import type { QueryContext } from '$lib/zero/schema';
import type { Query } from '$lib/server/db/zeroDrizzle';
import { array, type InferOutput, object, nullable, optional, picklist } from 'valibot';
import { listFilter, parseSchema, type ListFilter, uuid, unixTimestamp } from '$lib/schema/helpers';
import { readActionCodeZero, actionCodeType } from '$lib/schema/action-code';

export const inputSchema = object({
	organizationId: listFilter.entries.organizationId,
	referenceId: optional(nullable(uuid))
});
export type EventListFilter = InferOutput<typeof inputSchema>;

export function listActionCodesQuery({
	tx,
	ctx,
	input
}: {
	tx?: Query;
	ctx: QueryContext;
	input: InferOutput<typeof inputSchema>;
}) {
	const zero = tx || builder;
	let q = zero.actionCode
		.where('organizationId', '=', input.organizationId)
		.where('referenceId', '=', input.referenceId!)
		.where('deletedAt', 'IS', null)
		.orderBy('createdAt', 'desc');
	return q;
}

export const listActionCodes = syncedQueryWithContext(
	'listActionCodes',
	parseSchema(inputSchema),
	(ctx: QueryContext, filter) => {
		return listActionCodesQuery({ ctx, input: filter });
	}
);

export const outputSchema = array(readActionCodeZero);
