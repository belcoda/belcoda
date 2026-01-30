import { appState, getListFilter } from '$lib/state.svelte';
import { type FilterType } from '$lib/schema/person/filter';
import { z } from '$lib/zero.svelte';

import { countryCodes } from '$lib/utils/country';
import { ageGroupList } from '$lib/utils/person';
import { languageCodes } from '$lib/utils/language';
import { genderOptions } from '$lib/utils/person';

import { listEvents } from '$lib/zero/query/event/list';
import { listTeams } from '$lib/zero/query/team/list';
import { listTags } from '$lib/zero/query/tag/list';
import { listPersons } from '$lib/zero/query/person/list';

function startsWithOneOf(str: string, prefixes: string[]): boolean {
	return prefixes.some((prefix) => str.startsWith(prefix));
}

export function buildGetOptions(
	organizationId: string
): ({ search }: { search: string }) => { options: FilterType[]; hasMore: boolean } {
	return ({ search }: { search: string }) => getOptions(search, organizationId);
}
/* export function buildGetOptions(
	organizationId: string
): ({ search }: { search: string }) => Promise<{ options: FilterType[]; hasMore: boolean }> {
	return async ({ search }: { search: string }) => getOptions(search, organizationId);
} */

function getOptions(
	searchString: string,
	organizationId: string
): { options: FilterType[]; hasMore: boolean } {
	let showMainFilters = true;
	const options: FilterType[] = [];
	if (searchString.startsWith('age:')) {
		showMainFilters = false;
		options.push(
			...ageGroupList.map((ageGroup) => ({
				type: 'ageGroup' as const,
				ageGroup,
				label: `Age: ${ageGroup}`
			}))
		);
	}

	if (searchString.startsWith('country:')) {
		showMainFilters = false;
		options.push(
			...countryCodes.map((country) => ({
				type: 'country' as const,
				country,
				label: `Country: ${country}`
			}))
		);
	}

	if (searchString.startsWith('language:')) {
		showMainFilters = false;
		options.push(
			...languageCodes.map((language) => ({
				type: 'preferredLanguage' as const,
				preferredLanguage: language,
				label: `language:${language}`
			}))
		);
	}

	if (searchString.startsWith('gender:')) {
		showMainFilters = false;
		options.push(
			...genderOptions.map((gender) => ({
				type: 'gender' as const,
				gender,
				label: `gender:${gender}`
			}))
		);
	}
	if (searchString.startsWith('event:')) {
		options.push(
			...[
				{
					label: 'noshow:No show (ever)',
					type: 'eventActivity' as const,
					include: 'any' as const,
					status: 'noshow' as const
				},
				{
					label: 'noshow:No show (past 30 days)',
					type: 'eventActivity' as const,
					include: 'past30' as const,
					status: 'noshow' as const
				},
				{
					label: 'noshow:No show (past 90 days)',
					type: 'eventActivity' as const,
					include: 'past90' as const,
					status: 'noshow' as const
				},
				{
					label: 'noshow:No show (past 6 months)',
					type: 'eventActivity' as const,
					include: 'past180' as const,
					status: 'noshow' as const
				},
				{
					label: 'noshow:No show (past year)',
					type: 'eventActivity' as const,
					include: 'pastyear' as const,
					status: 'noshow' as const
				}
			]
		);
	}

	if (searchString.startsWith('attended:')) {
		options.push(
			...generateEventSignupOptions({ organizationId, searchString, status: 'attended' })
		);
	}
	if (searchString.startsWith('noshow:')) {
		options.push(...generateEventSignupOptions({ organizationId, searchString, status: 'noshow' }));
	}
	if (searchString.startsWith('signup:')) {
		options.push(...generateEventSignupOptions({ organizationId, searchString, status: 'signup' }));
	}

	if (showMainFilters) {
		if (!startsWithOneOf(searchString, ['attended:', 'noshow:', 'signup:', 'cancelled:'])) {
			// we only return events if it's NOT an event status filter...
			options.push(...generateEventSignupOptions({ organizationId, searchString, status: 'any' }));
		}
		options.push(...generateTeamOptions({ organizationId, searchString }));
		options.push(...generateTagOptions({ organizationId, searchString }));
		options.push(...generatePeopleOptions({ organizationId, searchString }));
	}
	return { options: options, hasMore: false };
}

export function generateEventSignupOptions({
	organizationId,
	searchString,
	status
}: {
	organizationId: string;
	searchString: string;
	status: 'any' | 'signup' | 'attended' | 'noshow';
}): FilterType[] {
	const listFilter = getListFilter(organizationId, { searchString, pageSize: 5 });
	const d = $derived.by(() => {
		const query = z.createQuery(listEvents(appState.queryContext, listFilter));
		const suffix = status === 'any' ? '' : ` (${status})`;
		return query.data?.map((event) => ({
			label: `${event.title} ${suffix}`,
			type: 'eventSignup' as const,
			eventId: event.id,
			status
		}));
	});
	return d;
}

export function generateTeamOptions({
	organizationId,
	searchString
}: {
	organizationId: string;
	searchString: string;
}): FilterType[] {
	const listFilter = getListFilter(organizationId, { searchString, pageSize: 5 });
	const d = $derived.by(() => {
		const query = z.createQuery(listTeams(appState.queryContext, listFilter));
		return query.data?.map((team) => ({
			type: 'teamId' as const,
			teamId: team.id,
			name: team.name,
			label: `${team.name}`
		}));
	});
	return d;
}

export function generateTagOptions({
	organizationId,
	searchString
}: {
	organizationId: string;
	searchString: string;
}): FilterType[] {
	const listFilter = getListFilter(organizationId, { searchString, pageSize: 5 });
	const d = $derived.by(() => {
		const query = z.createQuery(listTags(appState.queryContext, listFilter));
		return query.data?.map((tag) => ({
			type: 'hasTag' as const,
			tagId: tag.id,
			name: tag.name,
			label: `${tag.name}`
		}));
	});
	return d;
}

export function generatePeopleOptions({
	organizationId,
	searchString
}: {
	organizationId: string;
	searchString: string;
}): FilterType[] {
	const listFilter = getListFilter(organizationId, { searchString, pageSize: 5 });
	const d = $derived.by(() => {
		const query = z.createQuery(listPersons(appState.queryContext, listFilter));
		return query.data?.map((person) => ({
			type: 'personId' as const,
			personId: person.id,
			givenName: person.givenName,
			familyName: person.familyName,
			profilePicture: person.profilePicture,
			label: `${person.givenName} ${person.familyName}`
		}));
	});
	return d;
}
