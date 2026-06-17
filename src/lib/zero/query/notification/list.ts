import { defineQuery, type ExpressionBuilder } from '@rocicorp/zero';
import { builder, type Schema, type QueryContext } from '$lib/zero/schema';
import { array, type InferOutput, nullable, object, optional } from 'valibot';
import { listFilter } from '$lib/schema/helpers';
import { notificationStatus, readNotificationZero } from '$lib/schema/notification';
import { notificationReadPermissions } from '$lib/zero/query/notification/permissions';
import { decodeNotificationListCursor } from '$lib/utils/notification/cursor';

const RECENT_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
const DEFAULT_PAGE_SIZE = 50;

export const inputSchema = object({
	...listFilter.entries,
	status: optional(nullable(notificationStatus))
});

export type ListNotificationsInput = InferOutput<typeof inputSchema>;

function listNotificationsQueryBase({
	ctx,
	input,
	limit
}: {
	ctx: QueryContext;
	input: ListNotificationsInput;
	limit: number;
}) {
	let q = builder.notification
		.where((expr) => notificationReadPermissions(expr, ctx))
		.where('organizationId', '=', input.organizationId)
		.where((expr) => whereClause(expr, { filter: input }))
		.orderBy('createdAt', 'desc')
		.orderBy('id', 'desc')
		.limit(limit);
	if (input.cursor) {
		const cursor = decodeNotificationListCursor(input.cursor);
		if (cursor) {
			q = q.start(cursor);
		}
	}
	return q;
}

export function listNotificationsQuery({
	ctx,
	input
}: {
	ctx: QueryContext;
	input: ListNotificationsInput;
}) {
	const pageSize = input.pageSize || DEFAULT_PAGE_SIZE;
	return listNotificationsQueryBase({ ctx, input, limit: pageSize });
}

export function listNotificationsPaginatedQuery({
	ctx,
	input
}: {
	ctx: QueryContext;
	input: ListNotificationsInput;
}) {
	const pageSize = input.pageSize || DEFAULT_PAGE_SIZE;
	return listNotificationsQueryBase({ ctx, input, limit: pageSize + 1 });
}

function whereClause(
	builder: ExpressionBuilder<'notification', Schema>,
	{ filter }: { filter: ListNotificationsInput }
) {
	const { and, or, cmp } = builder;
	const filterArr = [
		cmp('id', 'NOT IN', filter.excludedIds),
		or(cmp('status', '=', 'unread'), cmp('createdAt', '>', Date.now() - RECENT_WINDOW_MS))
	];
	if (filter.status) {
		filterArr.push(cmp('status', '=', filter.status));
	}
	return and(...filterArr);
}

export const listNotifications = defineQuery(inputSchema, ({ ctx, args }) => {
	return listNotificationsPaginatedQuery({ ctx, input: args });
});

export const outputSchema = array(readNotificationZero);
