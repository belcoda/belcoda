import { filterGroup, type FilterGroupType, type FilterType } from '$lib/schema/person/filter';
import { drizzle } from '$lib/server/db';
import { person, eventSignup, personTag, personTeam } from '$lib/schema/drizzle';
import { type SQL, eq, inArray, not, sql, gte, lte, exists, isNull } from 'drizzle-orm';
import { ageGroups } from '$lib/utils/person';
import { type LanguageCode } from '$lib/utils/language';
import * as v from 'valibot';

const inputSchema = v.object({
	filter: filterGroup,
	organizationId: v.pipe(v.string(), v.uuid())
});

/**
 * Count persons matching the filter criteria using Drizzle
 * This is the server-side equivalent of the Zero query filter
 */
export async function countPersonsFromFilter({
	filter,
	organizationId
}: {
	filter: FilterGroupType;
	organizationId: string;
}): Promise<number> {
	const parsed = v.parse(inputSchema, { filter, organizationId });

	const conditions: SQL<unknown>[] = [
		eq(person.organizationId, parsed.organizationId),
		isNull(person.deletedAt)
	];

	// only count people with email addresses
	conditions.push(sql`${person.emailAddress} IS NOT NULL`);

	const filterConditions = processFilters(parsed.filter.filters);
	if (filterConditions.length > 0) {
		if (parsed.filter.type === 'and') {
			conditions.push(and(...filterConditions));
		} else {
			conditions.push(or(...filterConditions));
		}
	}

	if (parsed.filter.exclude.length > 0) {
		const excludeConditions = processExcludeFilters(parsed.filter.exclude);
		if (excludeConditions.length > 0) {
			conditions.push(not(and(...excludeConditions)));
		}
	}

	const result = await drizzle
		.select({ count: sql<number>`count(*)::int` })
		.from(person)
		.where(and(...conditions));

	return result[0]?.count ?? 0;
}

/**
 * Get all person IDs matching the filter criteria
 */
export async function getPersonIdsFromFilter({
	filter,
	organizationId
}: {
	filter: FilterGroupType;
	organizationId: string;
}): Promise<string[]> {
	const parsed = v.parse(inputSchema, { filter, organizationId });

	const conditions: SQL<unknown>[] = [
		eq(person.organizationId, parsed.organizationId),
		isNull(person.deletedAt),
		sql`${person.emailAddress} IS NOT NULL`
	];

	const filterConditions = processFilters(parsed.filter.filters);
	if (filterConditions.length > 0) {
		if (parsed.filter.type === 'and') {
			conditions.push(and(...filterConditions));
		} else {
			conditions.push(or(...filterConditions));
		}
	}

	if (parsed.filter.exclude.length > 0) {
		const excludeConditions = processExcludeFilters(parsed.filter.exclude);
		if (excludeConditions.length > 0) {
			conditions.push(not(and(...excludeConditions)));
		}
	}

	const results = await drizzle
		.select({ id: person.id, emailAddress: person.emailAddress })
		.from(person)
		.where(and(...conditions));

	return results.map((r) => r.id);
}

function processFilters(filters: FilterType[]): SQL<unknown>[] {
	const conditions: SQL<unknown>[] = [];

	for (const filter of filters) {
		switch (filter.type) {
			case 'personId':
				conditions.push(eq(person.id, filter.personId));
				break;
			case 'country':
				conditions.push(eq(person.country, filter.country));
				break;
			case 'ageGroup': {
				const ageRange = ageGroups[filter.ageGroup]();
				const ageCondition = and(
					gte(person.dateOfBirth, ageRange.min),
					lte(person.dateOfBirth, ageRange.max)
				);
				if (ageCondition) {
					conditions.push(ageCondition);
				}
				break;
			}
			case 'preferredLanguage':
				conditions.push(eq(person.preferredLanguage, filter.preferredLanguage as LanguageCode));
				break;
			case 'gender':
				conditions.push(eq(person.gender, filter.gender));
				break;
			case 'eventSignup': {
				const signupConditions: SQL<unknown>[] = [eq(eventSignup.eventId, filter.eventId)];
				switch (filter.status) {
					case 'signup':
						signupConditions.push(eq(eventSignup.status, 'signup'));
						break;
					case 'attended':
						signupConditions.push(eq(eventSignup.status, 'attended'));
						break;
					case 'noshow':
						signupConditions.push(eq(eventSignup.status, 'noshow'));
						break;
					case 'any':
						signupConditions.push(inArray(eventSignup.status, ['signup', 'attended', 'noshow']));
						break;
				}
				conditions.push(
					exists(
						drizzle
							.select({ id: eventSignup.id })
							.from(eventSignup)
							.where(and(eq(eventSignup.personId, person.id), ...signupConditions))
					)
				);
				break;
			}
			case 'teamId': {
				conditions.push(
					exists(
						drizzle
							.select({ personId: personTeam.personId })
							.from(personTeam)
							.where(and(eq(personTeam.personId, person.id), eq(personTeam.teamId, filter.teamId)))
					)
				);
				break;
			}
			case 'hasTag': {
				conditions.push(
					exists(
						drizzle
							.select({ personId: personTag.personId })
							.from(personTag)
							.where(and(eq(personTag.personId, person.id), eq(personTag.tagId, filter.tagId)))
					)
				);
				break;
			}
			case 'eventActivity': {
				const activityConditions: SQL<unknown>[] = [];
				if (filter.status === 'noshow') {
					activityConditions.push(eq(eventSignup.status, 'noshow'));
				}
				if (filter.status === 'attended') {
					activityConditions.push(eq(eventSignup.status, 'attended'));
				}
				if (filter.include === 'past30') {
					activityConditions.push(
						gte(eventSignup.createdAt, new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
					);
				}
				if (filter.include === 'past90') {
					activityConditions.push(
						gte(eventSignup.createdAt, new Date(Date.now() - 90 * 24 * 60 * 60 * 1000))
					);
				}
				if (filter.include === 'past180') {
					activityConditions.push(
						gte(eventSignup.createdAt, new Date(Date.now() - 180 * 24 * 60 * 60 * 1000))
					);
				}
				if (filter.include === 'pastyear') {
					activityConditions.push(
						gte(eventSignup.createdAt, new Date(Date.now() - 365 * 24 * 60 * 60 * 1000))
					);
				}
				if (activityConditions.length > 0) {
					conditions.push(
						exists(
							drizzle
								.select({ id: eventSignup.id })
								.from(eventSignup)
								.where(and(eq(eventSignup.personId, person.id), ...activityConditions))
						)
					);
				}
				break;
			}
		}
	}

	return conditions;
}

function processExcludeFilters(filters: FilterType[]): SQL<unknown>[] {
	const conditions: SQL<unknown>[] = [];

	for (const filter of filters) {
		switch (filter.type) {
			case 'personId':
				conditions.push(eq(person.id, filter.personId));
				break;
			case 'country':
				conditions.push(eq(person.country, filter.country));
				break;
			case 'ageGroup': {
				const ageRange = ageGroups[filter.ageGroup]();
				const ageCondition = and(
					gte(person.dateOfBirth, ageRange.min),
					lte(person.dateOfBirth, ageRange.max)
				);
				if (ageCondition) {
					conditions.push(ageCondition);
				}
				break;
			}
			case 'preferredLanguage':
				conditions.push(eq(person.preferredLanguage, filter.preferredLanguage as LanguageCode));
				break;
			case 'gender':
				conditions.push(eq(person.gender, filter.gender));
				break;
		}
	}

	return conditions;
}

// We could import these from drizzle orm but they need us to add
// null checks in many places. Defining them here makes them easier to use
function or(...conditions: SQL<unknown>[]) {
	return sql`(${conditions.join(' OR ')})`;
}

function and(...conditions: SQL<unknown>[]) {
	return sql`(${conditions.join(' AND ')})`;
}
