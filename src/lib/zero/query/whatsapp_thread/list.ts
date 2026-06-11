import { defineQuery, type ExpressionBuilder } from '@rocicorp/zero';
import { builder, type Schema } from '$lib/zero/schema';
import type { QueryContext } from '$lib/zero/schema';
import { array, type InferOutput, object, optional, boolean } from 'valibot';
import { listFilter } from '$lib/schema/helpers';
import { whatsappThreadReadPermissions } from '$lib/zero/query/whatsapp_thread/permissions';
import { readWhatsappThreadZero } from '$lib/schema/whatsapp-thread';
import { decodeCommunicationsListCursor } from '$lib/utils/communications/cursor';

export const inputSchema = object({
	...listFilter.entries,
	isDraft: optional(boolean()),
	reverseCron: optional(boolean())
});
export type ListWhatsappThreadsInput = InferOutput<typeof inputSchema>;

function listWhatsappThreadsQueryBase({
	ctx,
	input,
	limit
}: {
	ctx: QueryContext;
	input: InferOutput<typeof inputSchema>;
	limit: number;
}) {
	const direction = input.reverseCron ? 'desc' : 'asc';
	let q = builder.whatsappThread
		.where((expr) => whatsappThreadReadPermissions(expr, ctx))
		.where('organizationId', '=', input.organizationId)
		.where((expr) => whereClause(expr, { filter: input }))
		.orderBy('updatedAt', direction)
		.orderBy('id', direction)
		.limit(limit);
	if (input.cursor) {
		const cursor = decodeCommunicationsListCursor(input.cursor);
		if (cursor) {
			q = q.start(cursor);
		}
	}
	return q;
}

/** Exact page size for non-UI callers. */
export function listWhatsappThreadsQuery({
	ctx,
	input
}: {
	ctx: QueryContext;
	input: InferOutput<typeof inputSchema>;
}) {
	const pageSize = input.pageSize || 50;
	return listWhatsappThreadsQueryBase({ ctx, input, limit: pageSize });
}

/**
 * Zero client pagination: fetches one row past `pageSize` so `PaginatedZeroList` can detect
 * `hasMore` via `processPage` without a separate count query.
 */
export function listWhatsappThreadsPaginatedQuery({
	ctx,
	input
}: {
	ctx: QueryContext;
	input: InferOutput<typeof inputSchema>;
}) {
	const pageSize = input.pageSize || 50;
	return listWhatsappThreadsQueryBase({ ctx, input, limit: pageSize + 1 });
}

export const listWhatsappThreads = defineQuery(inputSchema, ({ ctx, args }) => {
	return listWhatsappThreadsPaginatedQuery({ ctx, input: args });
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
