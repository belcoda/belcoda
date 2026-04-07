import { defineQuery, type ExpressionBuilder } from '@rocicorp/zero';
import { builder, type Schema } from '$lib/zero/schema';
import type { QueryContext } from '$lib/zero/schema';
import { array, type InferOutput, object } from 'valibot';
import { listFilter } from '$lib/schema/helpers';
import { whatsappThreadReadPermissions } from '$lib/zero/query/whatsapp_thread/permissions';
import { readWhatsappThreadZero } from '$lib/schema/whatsapp-thread';
import { optional, boolean } from 'valibot';

export const inputSchema = object({
	...listFilter.entries,
	isDraft: optional(boolean()),
	reverseCron: optional(boolean())
});
export type ListWhatsappThreadsInput = InferOutput<typeof inputSchema>;

export function listWhatsappThreadsQuery({
	ctx,
	input
}: {
	ctx: QueryContext;
	input: InferOutput<typeof inputSchema>;
}) {
	let q = builder.whatsappThread
		.where((expr) => whatsappThreadReadPermissions(expr, ctx))
		.where('organizationId', '=', input.organizationId)
		.where((expr) => whereClause(expr, { filter: input }))
		.limit(input.pageSize || 50);
	if (input.startAfter) {
		q = q.start({ id: input.startAfter });
	}
	if (input.reverseCron) {
		q = q.orderBy('updatedAt', 'desc');
	} else {
		q = q.orderBy('updatedAt', 'asc');
	}
	return q;
}

export const listWhatsappThreads = defineQuery(inputSchema, ({ ctx, args }) => {
	return listWhatsappThreadsQuery({ ctx, input: args });
});

function whereClause(
	builder: ExpressionBuilder<'whatsappThread', Schema>,
	{ filter }: { filter: ListWhatsappThreadsInput }
) {
	const isDeleted = filter.isDeleted ?? false;
	const { and, cmp } = builder;
	const filterArr = [
		cmp('deletedAt', isDeleted ? 'IS NOT' : 'IS', null),
		cmp('id', 'NOT IN', filter.excludedIds)
	];
	if (filter.searchString && filter.searchString.length > 0) {
		filterArr.push(cmp('title', 'ILIKE', `%${filter.searchString}%`));
	}
	if (filter.isDraft !== false) {
		filterArr.push(cmp('startedAt', 'IS', null));
	} else {
		filterArr.push(cmp('startedAt', 'IS NOT', null));
	}
	return and(...filterArr);
}

export const outputSchema = array(readWhatsappThreadZero);
