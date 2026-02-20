import { defineQuery, type ExpressionBuilder } from '@rocicorp/zero';
import { builder, type Schema } from '$lib/zero/schema';
import type { QueryContext } from '$lib/zero/schema';
import { array, type InferOutput, object, nullable, optional, picklist, boolean } from 'valibot';
import { listFilter, parseSchema, uuid, unixTimestamp } from '$lib/schema/helpers';
import { eventReadPermissions } from '$lib/zero/query/event/permissions';
import { readEventZero } from '$lib/schema/event';

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

export function listEventsQuery({
	ctx,
	input
}: {
	ctx: QueryContext;
	input: InferOutput<typeof inputSchema>;
}) {
	let q = builder.event
		.where((expr) => eventReadPermissions(expr, ctx))
		.where('organizationId', '=', input.organizationId)
		.where((expr) => whereClause(expr, { filter: input }))
		.orderBy('startsAt', 'asc')
		.limit(input.pageSize || 50);
	if (input.startAfter) {
		q = q.start({ id: input.startAfter });
	}
	return q;
}

export const listEvents = defineQuery(inputSchema, ({ ctx, args }) => {
	return listEventsQuery({ ctx, input: args });
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
		if (filter.dateRange.start) {
			filterArr.push(cmp('startsAt', '>=', filter.dateRange.start));
		}
		if (filter.dateRange.end) {
			filterArr.push(cmp('endsAt', '<=', filter.dateRange.end));
		}
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
		if (filter.eventType === 'online') {
			filterArr.push(cmp('onlineLink', 'IS NOT', null));
		} else if (filter.eventType === 'in-person') {
			filterArr.push(cmp('addressLine1', 'IS NOT', null));
		}
	}
	if (filter.status) {
		if (filter.status === 'draft') {
			filterArr.push(cmp('published', '=', false));
		} else if (filter.status === 'published') {
			filterArr.push(cmp('published', '=', true));
		} else if (filter.status === 'cancelled') {
			filterArr.push(cmp('cancelledAt', 'IS NOT', null));
		}
	}
	return and(...filterArr);
}

export const outputSchema = array(readEventZero);
