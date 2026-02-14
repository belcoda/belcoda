import { defineQuery, type ExpressionBuilder } from '@rocicorp/zero';
import { builder, type Schema } from '$lib/zero/schema';
import type { QueryContext } from '$lib/zero/schema';
import { array, type InferOutput, object, optional, boolean } from 'valibot';
import { listFilter, parseSchema, uuid } from '$lib/schema/helpers';
import { eventSignupReadPermissions } from '$lib/zero/query/event_signup/permissions';
import { readEventSignupZero } from '$lib/schema/event-signup';
import { eventSignupDetails, eventSignupStatus } from '$lib/schema/event/settings';

export const inputSchema = object({
	...listFilter.entries,
	eventId: optional(uuid),
	tagId: optional(uuid),
	status: optional(eventSignupStatus),
	includeDeleted: optional(boolean())
});
export type ListEventSignupsInput = InferOutput<typeof inputSchema>;

export function listEventSignupsQuery({
	ctx,
	input
}: {
	ctx: QueryContext;
	input: ListEventSignupsInput;
}) {
	let q = builder.eventSignup
		.related('person')
		.where((expr) => eventSignupReadPermissions(expr, ctx))
		.where('organizationId', '=', input.organizationId)
		.where((expr) => whereClause(expr, { filter: input }))
		.limit(input.pageSize || 50);
	if (input.startAfter) {
		q = q.start({ id: input.startAfter });
	}
	return q;
}

export const listEventSignups = defineQuery(inputSchema, ({ ctx, args }) => {
	return listEventSignupsQuery({ ctx, input: args });
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

export const outputSchema = array(readEventSignupZero);
