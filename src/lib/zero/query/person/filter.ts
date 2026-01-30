import { filterGroup, type FilterGroupType, type FilterType } from '$lib/schema/person/filter';
import { type ExpressionBuilder } from '@rocicorp/zero';
import { builder, type Schema, type QueryContext } from '$lib/zero/schema';
import { object, parse, array, type InferOutput } from 'valibot';
import { uuid } from '$lib/schema/helpers';
import { readPersonZero } from '$lib/schema/person';

import { ageGroups } from '$lib/utils/person';
import { type LanguageCode } from '$lib/utils/language';
import { personReadPermissions } from './permissions';

export const inputSchema = object({
	filter: filterGroup,
	organizationId: uuid
});

export function whereClause(
	builder: ExpressionBuilder<Schema, 'person'>,
	{ filter, ctx }: { filter: InferOutput<typeof inputSchema>; ctx: QueryContext }
) {
	const { and, or, cmp, not } = builder;

	const filters =
		filter.filter.type === 'and'
			? and(...processFilters(filter.filter.filters, builder))
			: or(...processFilters(filter.filter.filters, builder));

	const excludeFilters =
		filter.filter.exclude.length > 0
			? not(and(...processExcludeFilters(filter.filter.exclude, builder)))
			: null;

	const filterArr = [
		personReadPermissions(builder, ctx),
		cmp('deletedAt', 'IS', null),
		cmp('organizationId', '=', filter.organizationId),
		filters,
		excludeFilters
	];

	return and(...filterArr.filter((filter) => filter !== null)); //strip out null exclude filters
}

export const outputSchema = array(readPersonZero);

export function processFilters(
	filters: FilterType[],
	builder: ExpressionBuilder<Schema, 'person'>
) {
	const { and, or, exists, cmp } = builder;
	const filterArr = [];
	for (const filter of filters) {
		switch (filter.type) {
			case 'personId':
				filterArr.push(cmp('id', '=', filter.personId));
				break;
			case 'country':
				filterArr.push(cmp('country', '=', filter.country));
				break;
			case 'ageGroup':
				filterArr.push(
					and(
						cmp('dateOfBirth', '>=', ageGroups[filter.ageGroup]().min.getTime()),
						cmp('dateOfBirth', '<=', ageGroups[filter.ageGroup]().max.getTime())
					)
				);
				break;
			case 'preferredLanguage':
				filterArr.push(cmp('preferredLanguage', '=', filter.preferredLanguage as LanguageCode));
				break;
			case 'gender':
				filterArr.push(cmp('gender', '=', filter.gender));
				break;
			case 'eventSignup':
				filterArr.push(
					exists('eventSignups', (es) => {
						return es.where(({ and, cmp, or }) => {
							const filters = [cmp('eventId', '=', filter.eventId)];
							switch (filter.status) {
								case 'any':
									filters.push(
										or(
											cmp('status', '=', 'signup'),
											cmp('status', '=', 'attended'),
											cmp('status', '=', 'noshow')
										)
									);
									break;
								case 'signup':
									filters.push(cmp('status', '=', 'signup'));
									break;
								case 'attended':
									filters.push(cmp('status', '=', 'attended'));
									break;
								case 'noshow':
									filters.push(cmp('status', '=', 'noshow'));
									break;
							}
							return and(...filters);
						});
					})
				);
				break;
			case 'teamId':
				filterArr.push(
					exists('teamMemberships', (tm) => {
						return tm.where('teamId', '=', filter.teamId);
					})
				);
				break;
			case 'hasTag':
				filterArr.push(
					exists('personTags', (pt) => {
						return pt.where('tagId', '=', filter.tagId);
					})
				);
				break;
			case 'eventActivity':
				filterArr.push(
					exists('eventSignups', (es) => {
						return es.where(({ and, cmp, or }) => {
							const filterArray = [];
							if (filter.status === 'noshow') {
								filterArray.push(cmp('status', 'noshow'));
							}
							if (filter.status === 'attended') {
								filterArray.push(cmp('status', 'attended'));
							}
							if (filter.include === 'past30') {
								filterArray.push(
									cmp('createdAt', '>=', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).getTime())
								);
							}
							if (filter.include === 'past90') {
								filterArray.push(
									cmp('createdAt', '>=', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).getTime())
								);
							}
							if (filter.include === 'past180') {
								filterArray.push(
									cmp('createdAt', '>=', new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).getTime())
								);
							}
							if (filter.include === 'pastyear') {
								filterArray.push(
									cmp('createdAt', '>=', new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).getTime())
								);
							}
							return and(...filterArray);
						});
					})
				);
				break;
			default:
				break;
		}
	}
	return filterArr;
}

/**
 * This is a simple function for excluding people from the query,
 * but it cannot use exists/relationship refinements because that
 * isn't currently supported by Zero.
 */
export function processExcludeFilters(
	filters: FilterType[],
	builder: ExpressionBuilder<Schema, 'person'>
) {
	const { and, cmp } = builder; // no exists because we are exclusive (ie: with not in, which doesn't work for exists)
	const filterArr = [];
	for (const filter of filters) {
		switch (filter.type) {
			case 'personId':
				filterArr.push(cmp('id', '=', filter.personId));
				break;
			case 'country':
				filterArr.push(cmp('country', '=', filter.country));
				break;
			case 'ageGroup':
				filterArr.push(
					and(
						cmp('dateOfBirth', '>=', ageGroups[filter.ageGroup]().min.getTime()),
						cmp('dateOfBirth', '<=', ageGroups[filter.ageGroup]().max.getTime())
					)
				);
				break;
			case 'preferredLanguage':
				filterArr.push(cmp('preferredLanguage', '=', filter.preferredLanguage as LanguageCode));
				break;
			case 'gender':
				filterArr.push(cmp('gender', '=', filter.gender));
				break;
		}
	}
	return filterArr;
}
