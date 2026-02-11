import * as v from 'valibot';
import { url, givenName, familyName, longString, mediumString } from '$lib/schema/helpers';
import { countryCodes } from '$lib/utils/country';
import { genderOptions, ageGroupList } from '$lib/utils/person';
export const filterTypes = {
	personId: v.object({
		type: v.literal('personId'),
		personId: v.pipe(v.string(), v.uuid()),
		label: mediumString,
		givenName: v.nullable(givenName),
		familyName: v.nullable(familyName),
		profilePicture: v.nullable(url)
	}),

	country: v.object({
		type: v.literal('country'),
		country: v.picklist(countryCodes),
		label: mediumString
	}),

	ageGroup: v.object({
		type: v.literal('ageGroup'),
		ageGroup: v.picklist(ageGroupList),
		label: mediumString
	}),

	preferredLanguage: v.object({
		type: v.literal('preferredLanguage'),
		preferredLanguage: v.pipe(v.string(), v.minLength(2), v.maxLength(2)),
		label: mediumString
	}),

	gender: v.object({
		type: v.literal('gender'),
		gender: v.picklist(genderOptions),
		label: mediumString
	}),

	// FIELDS THAT REQUIRE SEARCHING TO PRESENT THE OPTIONS
	//event

	eventSignup: v.object({
		type: v.literal('eventSignup'),
		eventId: v.pipe(v.string(), v.uuid()),
		status: v.picklist(['any', 'signup', 'attended', 'noshow']),
		label: mediumString
	}),
	// groups, tags, whatsapp groups and point people

	groupId: v.object({
		type: v.literal('teamId'),
		teamId: v.pipe(v.string(), v.uuid()),
		name: mediumString,
		label: mediumString
	}),

	hasTag: v.object({
		type: v.literal('hasTag'),
		tagId: v.pipe(v.string(), v.uuid()),
		name: mediumString,
		label: mediumString
	}),

	//COMPLEX EVENT FILTERS

	eventActivity: v.object({
		type: v.literal('eventActivity'),
		include: v.picklist(['any', 'past30', 'past90', 'past180', 'pastyear']),
		status: v.picklist(['any', 'attended', 'noshow']),
		label: mediumString
	})
};
export const filterType = v.variant('type', [...Object.values(filterTypes)]);
export type FilterType = v.InferOutput<typeof filterType>;

export const filterGroup = v.object({
	type: v.picklist(['and', 'or']),
	filters: v.array(filterType),
	exclude: v.array(filterType)
});
export type FilterGroupType = v.InferOutput<typeof filterGroup>;

export const defaultFilterGroup = {
	type: 'or' as 'and' | 'or', //otherwise the type will be inferred as string
	filters: [] as FilterType[],
	exclude: [] as FilterType[]
};
