import * as v from 'valibot';
import { url, givenName, familyName, longString, mediumString } from '$lib/schema/helpers';
import { regionList, ageGroupList } from '$lib/schema/filter/data';
import { countryCodes } from '$lib/utils/country';
import { genderOptions } from '$lib/utils/person';
export const filterTypes = {
	// ✅ Appears to be working
	region: v.object({
		type: v.literal('region'),
		region: v.picklist(regionList)
	}),
	personId: v.object({
		type: v.literal('personId'),
		personId: v.pipe(v.string(), v.uuid()),
		givenName: givenName,
		familyName: familyName,
		profilePicture: v.nullable(url)
	}),
	// ✅ Appears to be working
	country: v.object({
		type: v.literal('country'),
		country: v.picklist(countryCodes)
	}),
	// ✅ Appears to be working
	ageGroup: v.object({
		type: v.literal('ageGroup'),
		ageGroup: v.picklist(ageGroupList)
	}),
	// ✅ Appears to be working
	preferredLanguage: v.object({
		type: v.literal('preferredLanguage'),
		preferredLanguage: v.pipe(v.string(), v.minLength(2), v.maxLength(2))
	}),
	// ✅ Appears to be working
	gender: v.object({
		type: v.literal('gender'),
		gender: v.picklist(genderOptions)
	}),
	// ✅ Appears to be working
	isAdmin: v.object({
		type: v.literal('isAdmin'),
		isAdmin: v.boolean()
	}),
	isGroupAdmin: v.object({
		type: v.literal('isGroupAdmin'),
		isGroupAdmin: v.boolean()
	}),
	isOwner: v.object({
		type: v.literal('isOwner'),
		isOwner: v.boolean()
	}),
	canSignIn: v.object({
		type: v.literal('canSignIn'),
		canSignIn: v.boolean()
	}),
	// ✅ Appears to be working
	hasSignedIn: v.object({
		type: v.literal('hasSignedIn'),
		hasSignedIn: v.boolean()
	}),
	//email info
	// ✅ Appears to be working
	hasEmail: v.object({
		type: v.literal('hasEmail'),
		hasEmail: v.boolean()
	}),
	// ✅ Appears to be working
	emailVerified: v.object({
		type: v.literal('emailVerified'),
		emailVerified: v.boolean()
	}),
	// ✅ Appears to be working
	emailSubscribed: v.object({
		type: v.literal('emailSubscribed'),
		emailSubscribed: v.boolean()
	}),
	//phone/whatsapp info
	// ✅ Appears to be working
	hasPhoneNumber: v.object({
		type: v.literal('hasPhoneNumber'),
		hasPhoneNumber: v.boolean()
	}),
	// ✅ Appears to be working
	phoneNumberVerified: v.object({
		type: v.literal('phoneNumberVerified'),
		phoneNumberVerified: v.boolean()
	}),
	// ✅ Appears to be working
	phoneNumberWhatsappVerified: v.object({
		type: v.literal('phoneNumberWhatsappVerified'),
		phoneNumberWhatsappVerified: v.boolean()
	}),
	// ✅ Appears to be working
	phoneNumberSubscribed: v.object({
		type: v.literal('phoneNumberSubscribed'),
		phoneNumberSubscribed: v.boolean()
	}),

	// FIELDS THAT REQUIRE SEARCHING TO PRESENT THE OPTIONS
	//event
	// ✅ Appears to be working
	eventSignup: v.object({
		type: v.literal('eventSignup'),
		eventId: v.pipe(v.string(), v.uuid()),
		title: mediumString,
		status: v.picklist(['any', 'signup', 'attended', 'noshow'])
	}),
	// groups, tags, whatsapp groups and point people
	// ✅ Appears to be working
	groupId: v.object({
		type: v.literal('groupId'),
		groupId: v.pipe(v.string(), v.uuid()),
		name: mediumString
	}),
	// ✅ Appears to be working
	pointPersonId: v.object({
		type: v.literal('pointPersonId'),
		pointPersonId: v.pipe(v.string(), v.uuid()),
		givenName: givenName,
		familyName: familyName,
		profilePicture: v.nullable(url)
	}),
	// ✅ Appears to be working
	hasTag: v.object({
		type: v.literal('hasTag'),
		tagId: v.pipe(v.string(), v.uuid()),
		name: mediumString
	}),
	// ✅ Appears to be working
	whatsAppGroupId: v.object({
		type: v.literal('whatsAppGroupId'),
		whatsAppGroupId: v.pipe(v.string(), v.uuid()),
		profilePicture: v.nullable(url),
		name: mediumString
	}),

	//COMPLEX EVENT FILTERS
	// ✅ Appears to be working
	eventActivity: v.object({
		type: v.literal('eventActivity'),
		include: v.picklist(['any', 'past30', 'past90', 'past180', 'pastyear']),
		status: v.picklist(['any', 'attended', 'noshow'])
	}),

	// USES "NEW OPTION" LOGIC TO GENERATE FILTERS BASED ON PERSON INFO
	//searching filter
	// ✅ Appears to be working
	personName: v.object({
		type: v.literal('personName'),
		name: mediumString
	}),
	// ✅ Appears to be working
	personEmail: v.object({
		type: v.literal('personEmail'),
		email: v.pipe(v.string(), v.minLength(1), v.maxLength(100))
	}),
	// ✅ Appears to be working
	personPhoneNumber: v.object({
		type: v.literal('personPhoneNumber'),
		phoneNumber: v.pipe(v.string(), v.minLength(1), v.maxLength(100))
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
