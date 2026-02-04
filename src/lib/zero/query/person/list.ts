import { syncedQueryWithContext, type ExpressionBuilder } from '@rocicorp/zero';
import { builder, type Schema, type QueryContext } from '$lib/zero/schema';
import type { Query } from '$lib/server/db/zeroDrizzle';
import { array, type InferOutput, optional, object, nullable, picklist } from 'valibot';
import { listFilter, parseSchema, type ListFilter, uuid } from '$lib/schema/helpers';
import { personReadPermissions } from '$lib/zero/query/person/permissions';
import { readPersonZero } from '$lib/schema/person';

export const inputSchema = object({
	...listFilter.entries,
	tagId: optional(nullable(uuid)),
	signupEventId: optional(nullable(uuid)),
	mostRecentActivity: optional(
		nullable(
			picklist([
				'7days',
				'30days',
				'90days',
				'1year',
				'noactivity7days',
				'noactivity30days',
				'noactivity90days',
				'noactivity1year'
			])
		)
	),
	personIdsToExclude: optional(array(uuid))
});

export type ListPersonsInput = InferOutput<typeof inputSchema>;
export function listPersonsQuery({
	tx,
	ctx,
	input
}: {
	tx?: Query;
	ctx: QueryContext;
	input: InferOutput<typeof inputSchema>;
}) {
	const zero = tx || builder;
	let q = zero.person
		.where((expr) => personReadPermissions(expr, ctx))
		.where('organizationId', '=', input.organizationId)
		.where((expr) => whereClause(expr, { filter: input, userId: ctx.userId }))
		.orderBy('mostRecentActivityAt', 'desc')
		.limit(input.pageSize || 50);
	if (input.startAfter) {
		q = q.start({ id: input.startAfter });
	}
	return q;
}

export const listPersons = syncedQueryWithContext(
	'listPersons',
	parseSchema(inputSchema),
	(ctx: QueryContext, filter) => {
		return listPersonsQuery({ ctx, input: filter });
	}
);

export function listFilteredPersonsQuery({
	tx,
	ctx,
	input
}: {
	tx?: Query;
	ctx: QueryContext;
	input: InferOutput<typeof inputSchema>;
}) {
	const zero = tx || builder;
	const q = zero.person
		.where((expr) => personReadPermissions(expr, ctx))
		.where('organizationId', '=', input.organizationId)
		.where((expr) => whereClause(expr, { filter: input, userId: ctx.userId }))
		.orderBy('mostRecentActivityAt', 'desc')
		.limit(input.pageSize || 50);
	return q;
}

export function listPersonByIdsArrayQuery({
	tx,
	ctx,
	input
}: {
	tx?: Query;
	ctx: QueryContext;
	input: { ids: string[] };
}) {
	const zero = tx || builder;
	const q = zero.person
		.where('id', 'IN', input.ids)
		.where((expr) => personReadPermissions(expr, ctx))
		.limit(input.ids.length);
	return q;
}

export const listPersonByIdsArray = syncedQueryWithContext(
	'listPersonByIdsArray',
	parseSchema(object({ ids: array(uuid) })),
	(ctx: QueryContext, input) => {
		return listPersonByIdsArrayQuery({ ctx, input });
	}
);

function whereClause(
	builder: ExpressionBuilder<Schema, 'person'>,
	{ filter, userId }: { filter: InferOutput<typeof inputSchema>; userId: string }
) {
	const isDeleted = filter.isDeleted ?? false;
	const { and, or, exists, cmp } = builder;
	const filterArr = [cmp('deletedAt', isDeleted ? 'IS NOT' : 'IS', null)];
	if (filter.searchString && filter.searchString.length > 0) {
		if (filter.searchString.includes('@')) {
			filterArr.push(cmp('emailAddress', 'ILIKE', `%${filter.searchString}%`));
		} else if (filter.searchString.match(/^\+?[1-9]\d{1,14}$/)) {
			filterArr.push(cmp('phoneNumber', 'ILIKE', `%${filter.searchString}%`));
		} else if (filter.searchString.includes(' ')) {
			const [givenName, familyName] = filter.searchString.split(' ');
			filterArr.push(
				or(
					cmp('givenName', 'ILIKE', `%${givenName}%`),
					cmp('familyName', 'ILIKE', `%${familyName}%`)
				)
			);
		} else {
			filterArr.push(
				or(
					cmp('givenName', 'ILIKE', `%${filter.searchString}%`),
					cmp('familyName', 'ILIKE', `%${filter.searchString}%`)
				)
			);
		}
	}
	if (filter.teamId) {
		filterArr.push(
			exists('teamMemberships', (tm) => {
				return tm.where('teamId', '=', filter.teamId!); // ! is safe because teamId is not null
			})
		);
	}
	if (filter.tagId) {
		filterArr.push(
			exists('personTags', (pt) => {
				return pt.where('tagId', '=', filter.tagId!); // ! is safe because tagId is not null
			})
		);
	}
	if (filter.signupEventId) {
		filterArr.push(
			exists('eventSignups', (es) => {
				return es.where('eventId', '=', filter.signupEventId!); // ! is safe because signupEventId is not null
			})
		);
	}
	if (filter.mostRecentActivity) {
		if (filter.mostRecentActivity === '7days') {
			filterArr.push(cmp('mostRecentActivityAt', '>', Date.now() - 7 * 24 * 60 * 60 * 1000));
		} else if (filter.mostRecentActivity === '30days') {
			filterArr.push(cmp('mostRecentActivityAt', '>', Date.now() - 30 * 24 * 60 * 60 * 1000));
		} else if (filter.mostRecentActivity === '90days') {
			filterArr.push(cmp('mostRecentActivityAt', '>', Date.now() - 90 * 24 * 60 * 60 * 1000));
		} else if (filter.mostRecentActivity === '1year') {
			filterArr.push(cmp('mostRecentActivityAt', '>', Date.now() - 365 * 24 * 60 * 60 * 1000));
		} else if (filter.mostRecentActivity === 'noactivity7days') {
			filterArr.push(cmp('mostRecentActivityAt', '<', Date.now() - 7 * 24 * 60 * 60 * 1000));
		} else if (filter.mostRecentActivity === 'noactivity30days') {
			filterArr.push(cmp('mostRecentActivityAt', '<', Date.now() - 30 * 24 * 60 * 60 * 1000));
		} else if (filter.mostRecentActivity === 'noactivity90days') {
			filterArr.push(cmp('mostRecentActivityAt', '<', Date.now() - 90 * 24 * 60 * 60 * 1000));
		} else if (filter.mostRecentActivity === 'noactivity1year') {
			filterArr.push(cmp('mostRecentActivityAt', '<', Date.now() - 365 * 24 * 60 * 60 * 1000));
		}
	}
	if (filter.personIdsToExclude) {
		filterArr.push(cmp('id', 'NOT IN', filter.personIdsToExclude));
	}
	return and(...filterArr);
}

export const outputSchema = array(readPersonZero);
