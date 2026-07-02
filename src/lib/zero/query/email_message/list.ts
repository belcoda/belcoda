import { defineQuery, type ExpressionBuilder } from '@rocicorp/zero';
import { builder, type Schema, type QueryContext } from '$lib/zero/schema';
import { array, type InferOutput, object, optional, nullable, boolean } from 'valibot';
import { listFilter } from '$lib/schema/helpers';
import { emailMessageReadPermissions } from '$lib/zero/query/email_message/permissions';
import { readEmailMessageZero } from '$lib/schema/email-message';
import { decodeCommunicationsListCursor } from '$lib/utils/communications/cursor';

export const inputSchema = object({
	...listFilter.entries,
	isDraft: optional(nullable(boolean())),
	reverseCron: optional(boolean())
});
export type ListEmailMessagesInput = InferOutput<typeof inputSchema>;

function listEmailMessagesQueryBase({
	ctx,
	input,
	limit
}: {
	ctx: QueryContext;
	input: InferOutput<typeof inputSchema>;
	limit: number;
}) {
	const direction = input.reverseCron ? 'desc' : 'asc';
	let q = builder.emailMessage
		.where((expr) => emailMessageReadPermissions(expr, ctx))
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
export function listEmailMessagesQuery({
	ctx,
	input
}: {
	ctx: QueryContext;
	input: InferOutput<typeof inputSchema>;
}) {
	const pageSize = input.pageSize || 50;
	return listEmailMessagesQueryBase({ ctx, input, limit: pageSize });
}

/**
 * Zero client pagination: fetches one row past `pageSize` so `PaginatedZeroList` can detect
 * `hasMore` via `processPage` without a separate count query.
 */
export function listEmailMessagesPaginatedQuery({
	ctx,
	input
}: {
	ctx: QueryContext;
	input: InferOutput<typeof inputSchema>;
}) {
	const pageSize = input.pageSize || 50;
	return listEmailMessagesQueryBase({ ctx, input, limit: pageSize + 1 });
}

export const listEmailMessages = defineQuery(inputSchema, ({ ctx, args }) => {
	return listEmailMessagesPaginatedQuery({ ctx, input: args });
});

function whereClause(
	builder: ExpressionBuilder<'emailMessage', Schema>,
	{ filter }: { filter: ListEmailMessagesInput }
) {
	const isDeleted = filter.isDeleted ?? false;
	const { and, cmp } = builder;
	const filterArr = [
		cmp('deletedAt', isDeleted ? 'IS NOT' : 'IS', null),
		cmp('id', 'NOT IN', filter.excludedIds)
	];
	if (filter.searchString && filter.searchString.length > 0) {
		filterArr.push(cmp('subject', 'ILIKE', `%${filter.searchString}%`));
	}
	if (filter.isDraft !== undefined && filter.isDraft !== null) {
		if (filter.isDraft) {
			filterArr.push(cmp('startedAt', 'IS', null));
		} else {
			filterArr.push(cmp('startedAt', 'IS NOT', null));
		}
	}
	return and(...filterArr);
}

export const outputSchema = array(readEmailMessageZero);
