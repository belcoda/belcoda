import { defineQuery, type ExpressionBuilder } from '@rocicorp/zero';
import { builder, type Schema } from '$lib/zero/schema';
import type { QueryContext } from '$lib/zero/schema';
import type { Query } from '$lib/server/db/zeroDrizzle';
import { array, type InferOutput, object } from 'valibot';
import { listFilter, parseSchema, type ListFilter } from '$lib/schema/helpers';
import { webhookReadPermissions } from '$lib/zero/query/webhook/permissions';
import { readWebhookZero } from '$lib/schema/webhook';

export const inputSchema = object({
	...listFilter.entries
});
export type ListWebhooksInput = InferOutput<typeof inputSchema>;

export function listWebhooksQuery({
	tx,
	ctx,
	input
}: {
	tx?: Query;
	ctx: QueryContext;
	input: InferOutput<typeof inputSchema>;
}) {
	const zero = tx || builder;
	let q = zero.webhook
		.where((expr) => webhookReadPermissions(expr, ctx))
		.where('organizationId', '=', input.organizationId)
		.where((expr) => whereClause(expr, { filter: input }))
		.orderBy('createdAt', 'desc')
		.limit(input.pageSize || 50);
	if (input.startAfter) {
		q = q.start({ id: input.startAfter });
	}
	return q;
}

export const listWebhooks = defineQuery(inputSchema, ({ ctx, args }) => {
	return listWebhooksQuery({ ctx, input: args });
});

function whereClause(
	builder: ExpressionBuilder<Schema, 'webhook'>,
	{ filter }: { filter: ListWebhooksInput }
) {
	const { and, cmp } = builder;
	const filterArr = [cmp('id', 'NOT IN', filter.excludedIds)];
	if (filter.searchString && filter.searchString.length > 0) {
		filterArr.push(cmp('name', 'ILIKE', `%${filter.searchString}%`));
	}
	return and(...filterArr);
}

export const outputSchema = array(readWebhookZero);
