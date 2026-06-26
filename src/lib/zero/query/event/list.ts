import { defineQuery, type ExpressionBuilder } from '@rocicorp/zero';
import { builder, type Schema, type QueryContext } from '$lib/zero/schema';
import { array, type InferOutput, object, nullable, optional, picklist, boolean } from 'valibot';
import { listFilter, parseSchema, uuid, unixTimestamp } from '$lib/schema/helpers';
import { eventReadPermissions } from '$lib/zero/query/event/permissions';
import { readEventZero } from '$lib/schema/event';
import { decodeEventListCursor } from '$lib/utils/event/cursor';

export const inputSchema = object({
	...listFilter.entries,
	tagId: optional(nullable(uuid)),
	eventType: optional(nullable(picklist(['online', 'in-person']))),
	status: optional(nullable(picklist(['draft', 'published', 'cancelled']))),
	hasSignups: optional(nullable(boolean())),
	isArchived: optional(nullable(boolean())),
	dateRange: optional(
		nullable(
			object({ start: optional(nullable(unixTimestamp)), end: optional(nullable(unixTimestamp)) })
		)
	)
});
export type EventListFilter = InferOutput<typeof inputSchema>;

function listEventsQueryBase({
	ctx,
	input,
	limit
}: {
	ctx: QueryContext;
	input: InferOutput<typeof inputSchema>;
	limit: number;
}) {
	let q = builder.event
		.where((expr) => eventReadPermissions(expr, ctx))
		.where('organizationId', '=', input.organizationId)
		.where((expr) => whereClause(expr, { filter: input }))
		.orderBy('startsAt', 'asc')
		.orderBy('id', 'asc')
		.limit(limit);
	if (input.cursor) {
		const cursor = decodeEventListCursor(input.cursor);
		if (cursor) {
			q = q.start(cursor);
		}
	}
	return q;
}

/** Exact page size for REST and other non-UI callers. */
export function listEventsQuery({
	ctx,
	input
}: {
	ctx: QueryContext;
	input: InferOutput<typeof inputSchema>;
}) {
	const pageSize = input.pageSize || 50;
	return listEventsQueryBase({ ctx, input, limit: pageSize });
}

/**
 * Zero client pagination: fetches one row past `pageSize` so `PaginatedZeroList` can detect
 * `hasMore` via `processPage` without a separate count query.
 */
export function listEventsPaginatedQuery({
	ctx,
	input
}: {
	ctx: QueryContext;
	input: InferOutput<typeof inputSchema>;
}) {
	const pageSize = input.pageSize || 50;
	return listEventsQueryBase({ ctx, input, limit: pageSize + 1 });
}

export const listEvents = defineQuery(inputSchema, ({ ctx, args }) => {
	return listEventsPaginatedQuery({ ctx, input: args });
});

function whereClause(
	builder: ExpressionBuilder<'event', Schema>,
	{ filter }: { filter: InferOutput<typeof inputSchema> }
) {
	const isDeleted = filter.isDeleted ?? false;
	const isArchived = filter.isArchived ?? false;
	const { and, cmp, or, exists } = builder;
	const filterArr = [
		cmp('deletedAt', isDeleted ? 'IS NOT' : 'IS', null),
		cmp('archivedAt', isArchived ? 'IS NOT' : 'IS', null)
	];
	if (filter.dateRange) {
		filterArr.push(...dateRangeConditions(cmp, filter.dateRange));
	}
	if (filter.hasSignups) {
		filterArr.push(exists('signups'));
	}
	if (filter.searchString && filter.searchString.length > 0) {
		filterArr.push(cmp('title', 'ILIKE', `%${filter.searchString}%`));
	}
	if (filter.tagId) {
		filterArr.push(
			or(cmp('signupTag', '=', filter.tagId!), cmp('attendanceTag', '=', filter.tagId!))
		);
	}
	if (filter.teamId) {
		filterArr.push(cmp('teamId', '=', filter.teamId!));
	}
	if (filter.eventType) {
		filterArr.push(...eventTypeConditions(cmp, filter.eventType));
	}
	if (filter.status) {
		filterArr.push(...statusConditions(cmp, filter.status));
	}
	return and(...filterArr);
}

type WhereCmp = ExpressionBuilder<'event', Schema>['cmp'];

function dateRangeConditions(
	cmp: WhereCmp,
	dateRange: NonNullable<InferOutput<typeof inputSchema>['dateRange']>
) {
	const conditions = [];
	if (dateRange.start) {
		conditions.push(cmp('startsAt', '>=', dateRange.start));
	}
	if (dateRange.end) {
		conditions.push(cmp('endsAt', '<=', dateRange.end));
	}
	return conditions;
}

function eventTypeConditions(
	cmp: WhereCmp,
	eventType: NonNullable<InferOutput<typeof inputSchema>['eventType']>
) {
	if (eventType === 'online') {
		return [cmp('onlineLink', 'IS NOT', null)];
	}
	if (eventType === 'in-person') {
		return [cmp('addressLine1', 'IS NOT', null)];
	}
	return [];
}

function statusConditions(
	cmp: WhereCmp,
	status: NonNullable<InferOutput<typeof inputSchema>['status']>
) {
	if (status === 'draft') {
		return [cmp('published', '=', false)];
	}
	if (status === 'published') {
		return [cmp('published', '=', true)];
	}
	if (status === 'cancelled') {
		return [cmp('cancelledAt', 'IS NOT', null)];
	}
	return [];
}

export const outputSchema = array(readEventZero);
