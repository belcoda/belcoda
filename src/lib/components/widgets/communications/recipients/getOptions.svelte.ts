import { appState, getListFilter } from '$lib/state.svelte';
import { type FilterType } from '$lib/schema/person/filter';
import { z } from '$lib/zero.svelte';

import { countryCodes, renderLocalizedCountryName } from '$lib/utils/country';
import { ageGroupList } from '$lib/utils/person';
import { languageCodes, getLocalizedLanguageName } from '$lib/utils/language';
import { genderOptions, renderGender } from '$lib/utils/person';
import { t } from '$lib/index.svelte';

export type FilterCategory =
	| 'default'
	| 'gender'
	| 'ageGroup'
	| 'preferredLanguage'
	| 'country'
	| 'eventActivity'
	| 'eventAttended'
	| 'eventNoshow';
export function getFilterType(searchString: string): {
	type: FilterCategory;
	searchString: string;
} {
	if (searchString.startsWith('age:')) {
		return { type: 'ageGroup' as const, searchString: searchString.replace('age:', '') };
	}
	if (searchString.startsWith('country:')) {
		return { type: 'country' as const, searchString: searchString.replace('country:', '') };
	}
	if (searchString.startsWith('language:')) {
		return {
			type: 'preferredLanguage' as const,
			searchString: searchString.replace('language:', '')
		};
	}
	if (searchString.startsWith('gender:')) {
		return { type: 'gender' as const, searchString: searchString.replace('gender:', '') };
	}
	if (searchString.startsWith('attended:')) {
		return { type: 'eventAttended' as const, searchString: searchString.replace('attended:', '') };
	}
	if (searchString.startsWith('noshow:')) {
		return { type: 'eventNoshow' as const, searchString: searchString.replace('noshow:', '') };
	}
	if (searchString.startsWith('event:')) {
		return { type: 'eventActivity' as const, searchString: searchString.replace('event:', '') };
	}
	return { type: 'default' as const, searchString: searchString };
}

export function getFilterOptionsByType(filterState: {
	type: FilterCategory;
	searchString: string;
}): FilterType[] {
	switch (filterState.type) {
		case 'ageGroup':
			return ageGroupList.map((ageGroup) => ({
				type: 'ageGroup' as const,
				ageGroup,
				label: `${ageGroup}`
			}));
		case 'country':
			return countryCodes.map((country) => ({
				type: 'country' as const,
				country,
				label: `${renderLocalizedCountryName(country, appState.locale)}`
			}));
		case 'preferredLanguage':
			return languageCodes.map((language) => ({
				type: 'preferredLanguage' as const,
				preferredLanguage: language,
				label: `${getLocalizedLanguageName(language)}`
			}));
		case 'gender':
			return genderOptions.map((gender) => ({
				type: 'gender' as const,
				gender,
				label: `${renderGender(gender)}`
			}));
		case 'eventActivity':
			return [
				{
					label: `noshow:${t`No show (ever)`}`,
					type: 'eventActivity' as const,
					include: 'any' as const,
					status: 'noshow' as const
				}
			];
		default: {
			return [];
		}
	}
}
