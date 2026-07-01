import { defineQuery, type ExpressionBuilder } from '@rocicorp/zero';
import { builder, type Schema, type QueryContext } from '$lib/zero/schema';
import { array, type InferOutput, optional, object, nullable, picklist } from 'valibot';
import { listFilter, uuid } from '$lib/schema/helpers';
import { personReadPermissions } from '$lib/zero/query/person/permissions';
import { readPersonZero } from '$lib/schema/person';
import { decodePersonListCursor } from '$lib/utils/person/cursor';

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

function listPersonsQueryBase({
	ctx,
	input,
	limit
}: {
	ctx: QueryContext;
	input: InferOutput<typeof inputSchema>;
	limit: number;
}) {
	let q = builder.person
		.where((expr) => personReadPermissions(expr, ctx))
		.where('organizationId', '=', input.organizationId)
		.where((expr) => whereClause(expr, { filter: input }))
		.orderBy('mostRecentActivityAt', 'desc')
		.orderBy('id', 'desc')
		.limit(limit);
	if (input.cursor) {
		const cursor = decodePersonListCursor(input.cursor);
		if (cursor) {
			q = q.start(cursor);
		}
	}
	return q;
}

/** Exact page size for REST and other non-UI callers. */
export function listPersonsQuery({
	ctx,
	input
}: {
	ctx: QueryContext;
	input: InferOutput<typeof inputSchema>;
}) {
	const pageSize = input.pageSize || 50;
	return listPersonsQueryBase({ ctx, input, limit: pageSize });
}

/**
 * Zero client pagination: fetches one row past `pageSize` so `PaginatedZeroList` can detect
 * `hasMore` via `processPage` without a separate count query.
 */
export function listPersonsPaginatedQuery({
	ctx,
	input
}: {
	ctx: QueryContext;
	input: InferOutput<typeof inputSchema>;
}) {
	const pageSize = input.pageSize || 50;
	return listPersonsQueryBase({ ctx, input, limit: pageSize + 1 });
}

export const listPersons = defineQuery(inputSchema, ({ ctx, args }) => {
	return listPersonsPaginatedQuery({ ctx, input: args });
});

export function listFilteredPersonsQuery({
	ctx,
	input
}: {
	ctx: QueryContext;
	input: InferOutput<typeof inputSchema>;
}) {
	const pageSize = input.pageSize || 50;
	return listPersonsQueryBase({ ctx, input, limit: pageSize });
}

export function listFilteredPersonsPaginatedQuery({
	ctx,
	input
}: {
	ctx: QueryContext;
	input: InferOutput<typeof inputSchema>;
}) {
	const pageSize = input.pageSize || 50;
	return listPersonsQueryBase({ ctx, input, limit: pageSize + 1 });
}

export function listPersonByIdsArrayQuery({
	ctx,
	input
}: {
	ctx: QueryContext;
	input: { ids: string[] };
}) {
	const q = builder.person
		.where('id', 'IN', input.ids)
		.where((expr) => personReadPermissions(expr, ctx))
		.limit(input.ids.length);
	return q;
}

export const listPersonByIdsArray = defineQuery(object({ ids: array(uuid) }), ({ ctx, args }) => {
	return listPersonByIdsArrayQuery({ ctx, input: args });
});

function whereClause(
	builder: ExpressionBuilder<'person', Schema>,
	{ filter }: { filter: InferOutput<typeof inputSchema> }
) {
	const isDeleted = filter.isDeleted ?? false;
	const { and, or, exists, cmp } = builder;
	const filterArr = [cmp('deletedAt', isDeleted ? 'IS NOT' : 'IS', null)];
	if (filter.searchString && filter.searchString.length > 0) {
		filterArr.push(...searchStringConditions(cmp, or, filter.searchString));
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
		filterArr.push(...mostRecentActivityConditions(cmp, filter.mostRecentActivity));
	}
	if (filter.personIdsToExclude && filter.personIdsToExclude.length > 0) {
		filterArr.push(cmp('id', 'NOT IN', filter.personIdsToExclude));
	}
	return and(...filterArr);
}

type WhereCmp = ExpressionBuilder<'person', Schema>['cmp'];
type WhereOr = ExpressionBuilder<'person', Schema>['or'];

function searchStringConditions(cmp: WhereCmp, or: WhereOr, searchString: string) {
	if (searchString.includes('@')) {
		return [cmp('emailAddress', 'ILIKE', `%${searchString}%`)];
	}
	if (searchString.match(/^\+?[1-9]\d{1,14}$/)) {
		return [cmp('phoneNumber', 'ILIKE', `%${searchString}%`)];
	}
	if (searchString.includes(' ')) {
		const [givenName, familyName] = searchString.split(' ');
		return [
			or(cmp('givenName', 'ILIKE', `%${givenName}%`), cmp('familyName', 'ILIKE', `%${familyName}%`))
		];
	}
	return [
		or(
			cmp('givenName', 'ILIKE', `%${searchString}%`),
			cmp('familyName', 'ILIKE', `%${searchString}%`)
		)
	];
}

function mostRecentActivityConditions(
	cmp: WhereCmp,
	mostRecentActivity: NonNullable<InferOutput<typeof inputSchema>['mostRecentActivity']>
) {
	const day = 24 * 60 * 60 * 1000;
	switch (mostRecentActivity) {
		case '7days':
			return [cmp('mostRecentActivityAt', '>', Date.now() - 7 * day)];
		case '30days':
			return [cmp('mostRecentActivityAt', '>', Date.now() - 30 * day)];
		case '90days':
			return [cmp('mostRecentActivityAt', '>', Date.now() - 90 * day)];
		case '1year':
			return [cmp('mostRecentActivityAt', '>', Date.now() - 365 * day)];
		case 'noactivity7days':
			return [cmp('mostRecentActivityAt', '<', Date.now() - 7 * day)];
		case 'noactivity30days':
			return [cmp('mostRecentActivityAt', '<', Date.now() - 30 * day)];
		case 'noactivity90days':
			return [cmp('mostRecentActivityAt', '<', Date.now() - 90 * day)];
		case 'noactivity1year':
			return [cmp('mostRecentActivityAt', '<', Date.now() - 365 * day)];
		default:
			return [];
	}
}

export const outputSchema = array(readPersonZero);
