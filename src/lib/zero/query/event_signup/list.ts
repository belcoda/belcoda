import { defineQuery, type ExpressionBuilder } from '@rocicorp/zero';
import { builder, type Schema, type QueryContext } from '$lib/zero/schema';
import { array, type InferOutput, object, optional, boolean } from 'valibot';
import { listFilter, uuid } from '$lib/schema/helpers';
import { eventSignupReadPermissions } from '$lib/zero/query/event_signup/permissions';
import { readEventSignupZeroWithPerson } from '$lib/schema/event-signup';
import { eventSignupStatus } from '$lib/schema/event/settings';
import {
	decodeEventSignupListCursor,
	decodeRestEventSignupListCursor
} from '$lib/utils/event-signup/cursor';

export const inputSchema = object({
	...listFilter.entries,
	eventId: optional(uuid),
	tagId: optional(uuid),
	status: optional(eventSignupStatus),
	includeDeleted: optional(boolean()),
	includeIncomplete: optional(boolean())
});
export type ListEventSignupsInput = InferOutput<typeof inputSchema>;

const byEventInputSchema = object({
	eventId: uuid,
	includeDeleted: optional(boolean()),
	includeIncomplete: optional(boolean())
});
export type EventSignupsByEventInput = InferOutput<typeof byEventInputSchema>;

function listEventSignupsRestQueryBase({
	ctx,
	input,
	limit
}: {
	ctx: QueryContext;
	input: InferOutput<typeof inputSchema>;
	limit: number;
}) {
	let q = builder.eventSignup
		.related('person')
		.where((expr) => eventSignupReadPermissions(expr, ctx))
		.where('organizationId', '=', input.organizationId)
		.where((expr) => whereClause(expr, { filter: input }))
		.orderBy('id', 'desc')
		.limit(limit);
	if (input.cursor) {
		const start = decodeRestEventSignupListCursor(input.cursor);
		if (start) {
			q = q.start(start);
		}
	}
	return q;
}

function listEventSignupsUiQueryBase({
	ctx,
	input,
	limit
}: {
	ctx: QueryContext;
	input: InferOutput<typeof inputSchema>;
	limit: number;
}) {
	let q = builder.eventSignup
		.related('person')
		.where((expr) => eventSignupReadPermissions(expr, ctx))
		.where('organizationId', '=', input.organizationId)
		.where((expr) => whereClause(expr, { filter: input }))
		.orderBy('createdAt', 'desc')
		.orderBy('id', 'desc')
		.limit(limit);
	if (input.cursor) {
		const start = decodeEventSignupListCursor(input.cursor);
		if (start) {
			q = q.start(start);
		}
	}
	return q;
}

/** Exact page size for REST callers. Sorts by id only to match the { id } REST cursor. */
export function listEventSignupsQuery({
	ctx,
	input
}: {
	ctx: QueryContext;
	input: ListEventSignupsInput;
}) {
	const pageSize = input.pageSize || 50;
	return listEventSignupsRestQueryBase({ ctx, input, limit: pageSize });
}

/**
 * Zero client pagination: fetches one row past `pageSize` so `PaginatedZeroList` can detect
 * `hasMore` via `processPage` without a separate count query.
 * Sorts by createdAt + id to match the { createdAt, id } encoded cursor.
 */
export function listEventSignupsPaginatedQuery({
	ctx,
	input
}: {
	ctx: QueryContext;
	input: ListEventSignupsInput;
}) {
	const pageSize = input.pageSize || 50;
	return listEventSignupsUiQueryBase({ ctx, input, limit: pageSize + 1 });
}

export function listEventSignupsByEventQuery({
	ctx,
	input
}: {
	ctx: QueryContext;
	input: EventSignupsByEventInput;
}) {
	let q = builder.eventSignup
		.related('person')
		.where((expr) => eventSignupReadPermissions(expr, ctx))
		.where('eventId', '=', input.eventId)
		.orderBy('createdAt', 'desc')
		.orderBy('id', 'desc');
	if (input.includeDeleted !== true) {
		q = q.where('status', 'IS NOT', 'deleted');
	}
	if (input.includeIncomplete !== true) {
		q = q.where('status', 'IS NOT', 'incomplete');
	}
	return q;
}

export const listEventSignups = defineQuery(inputSchema, ({ ctx, args }) => {
	return listEventSignupsPaginatedQuery({ ctx, input: args });
});

export const listEventSignupsByEvent = defineQuery(byEventInputSchema, ({ ctx, args }) => {
	return listEventSignupsByEventQuery({ ctx, input: args });
});

function whereClause(
	builder: ExpressionBuilder<'eventSignup', Schema>,
	{ filter }: { filter: ListEventSignupsInput }
) {
	const { and, exists, cmp } = builder;
	const filterArr: Array<ReturnType<typeof exists> | ReturnType<typeof cmp>> = [];
	if (filter.eventId) {
		filterArr.push(cmp('eventId', '=', filter.eventId!));
	}
	if (filter.includeDeleted !== true) {
		filterArr.push(cmp('status', 'IS NOT', 'deleted'));
	}
	if (filter.includeIncomplete !== true) {
		filterArr.push(cmp('status', 'IS NOT', 'incomplete'));
	}
	if (filter.status) {
		filterArr.push(cmp('status', '=', filter.status!));
	}
	if (filter.tagId) {
		filterArr.push(
			exists('person', (p) => {
				return p.whereExists('personTags', (pt) => {
					return pt.where('tagId', '=', filter.tagId!);
				});
			})
		);
	}
	if (filter.teamId) {
		filterArr.push(
			exists('event', (e) => {
				return e.where('teamId', '=', filter.teamId!);
			})
		);
	}

	if (filter.searchString) {
		filterArr.push(
			exists('person', (p) => {
				return p.where(({ or, cmp }) => {
					return or(
						cmp('givenName', 'ILIKE', `%${filter.searchString}%`),
						cmp('familyName', 'ILIKE', `%${filter.searchString}%`),
						cmp('emailAddress', 'ILIKE', `%${filter.searchString}%`),
						cmp('phoneNumber', 'ILIKE', `%${filter.searchString}%`)
					);
				});
			})
		);
	}
	return filterArr.length > 0 ? and(...filterArr) : and();
}

export const outputSchema = array(readEventSignupZeroWithPerson);
