import { defineQuery, type ExpressionBuilder } from '@rocicorp/zero';
import { builder, type Schema } from '$lib/zero/schema';
import type { QueryContext } from '$lib/zero/schema';
import { array, type InferOutput, object, optional, nullable, boolean } from 'valibot';
import { listFilter, parseSchema } from '$lib/schema/helpers';
import { emailMessageReadPermissions } from '$lib/zero/query/email_message/permissions';
import { readEmailMessageZero } from '$lib/schema/email-message';

export const inputSchema = object({
	...listFilter.entries,
	isDraft: optional(nullable(boolean()))
});
export type ListEmailMessagesInput = InferOutput<typeof inputSchema>;

export function listEmailMessagesQuery({
	ctx,
	input
}: {
	ctx: QueryContext;
	input: InferOutput<typeof inputSchema>;
}) {
	let q = builder.emailMessage
		.where((expr) => emailMessageReadPermissions(expr, ctx))
		.where('organizationId', '=', input.organizationId)
		.where((expr) => whereClause(expr, { filter: input }))
		.orderBy('updatedAt', 'desc')
		.limit(input.pageSize || 50);
	if (input.startAfter) {
		q = q.start({ id: input.startAfter });
	}
	return q;
}

export const listEmailMessages = defineQuery(inputSchema, ({ ctx, args }) => {
	return listEmailMessagesQuery({ ctx, input: args });
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
