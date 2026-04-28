import * as v from 'valibot';
import * as helpers from '$lib/schema/helpers';
import { socialMedia, personAddedFrom, DEFAULT_SOCIAL_MEDIA } from '$lib/schema/person/meta';
import { activityPreviewPayloads } from '$lib/schema/activity/types';
import type { SurveyQuestion } from '$lib/schema/survey/questions';

export type Gender = v.InferOutput<typeof helpers.gender>;

export const personSchema = v.object({
	id: helpers.uuid,
	organizationId: helpers.uuid,
	familyName: v.nullable(helpers.shortString),
	givenName: v.nullable(helpers.shortString),

	addressLine1: v.nullable(helpers.mediumStringEmpty),
	addressLine2: v.nullable(helpers.mediumStringEmpty),
	locality: v.nullable(helpers.mediumStringEmpty),
	region: v.nullable(helpers.mediumStringEmpty),
	postcode: v.nullable(helpers.mediumStringEmpty),

	country: helpers.countryCode,
	preferredLanguage: helpers.languageCode,

	workplace: v.nullable(helpers.mediumStringEmpty),
	position: v.nullable(helpers.mediumStringEmpty),
	gender: v.nullable(helpers.gender),
	dateOfBirth: v.nullable(helpers.pastDate),

	emailAddress: v.nullable(helpers.email),
	subscribed: v.boolean(),
	doNotContact: v.boolean(),
	phoneNumber: v.nullable(helpers.phoneNumber),
	whatsAppUsername: v.nullable(helpers.mediumString),

	socialMedia: socialMedia,
	externalId: v.nullable(helpers.mediumString),

	mostRecentActivityAt: helpers.date,
	mostRecentActivityPreview: v.nullable(activityPreviewPayloads),

	profilePicture: v.nullable(helpers.url),
	addedFrom: personAddedFrom,

	createdAt: helpers.date,
	updatedAt: helpers.date,
	deletedAt: v.nullable(helpers.date)
});
export type PersonSchema = v.InferOutput<typeof personSchema>;

export const personApiSchema = v.object({
	...v.omit(personSchema, ['organizationId']).entries,
	dateOfBirth: v.nullable(helpers.dateToString),
	mostRecentActivityAt: helpers.dateToString,
	createdAt: helpers.dateToString,
	updatedAt: helpers.dateToString,
	deletedAt: v.nullable(helpers.dateToString)
});

export const readPersonRest = v.object({
	...v.omit(personSchema, ['organizationId']).entries,
	dateOfBirth: v.nullable(helpers.timestampToDate),
	mostRecentActivityAt: helpers.timestampToDate,
	createdAt: helpers.timestampToDate,
	updatedAt: helpers.timestampToDate,
	deletedAt: v.nullable(helpers.timestampToDate)
});
export type ReadPersonRest = v.InferOutput<typeof readPersonRest>;

export const readPersonZero = v.object({
	...personSchema.entries,
	dateOfBirth: v.nullable(helpers.dateToTimestamp),
	mostRecentActivityAt: helpers.dateToTimestamp,
	createdAt: helpers.dateToTimestamp,
	updatedAt: helpers.dateToTimestamp,
	deletedAt: v.nullable(helpers.dateToTimestamp)
});
export type ReadPersonZero = v.InferOutput<typeof readPersonZero>;

export const createPerson = v.object({
	familyName: v.optional(personSchema.entries.familyName),
	givenName: v.optional(personSchema.entries.givenName),

	addressLine1: v.optional(personSchema.entries.addressLine1),
	addressLine2: v.optional(personSchema.entries.addressLine2),
	locality: v.optional(personSchema.entries.locality),
	region: v.optional(personSchema.entries.region),
	postcode: v.optional(personSchema.entries.postcode),

	country: personSchema.entries.country,
	preferredLanguage: personSchema.entries.preferredLanguage,

	workplace: v.optional(personSchema.entries.workplace),
	position: v.optional(personSchema.entries.position),
	gender: v.optional(personSchema.entries.gender),
	dateOfBirth: v.optional(personSchema.entries.dateOfBirth),

	emailAddress: v.optional(personSchema.entries.emailAddress),
	subscribed: v.optional(personSchema.entries.subscribed, true),
	doNotContact: v.optional(personSchema.entries.doNotContact, false),
	phoneNumber: v.optional(personSchema.entries.phoneNumber),
	whatsAppUsername: v.optional(personSchema.entries.whatsAppUsername),

	socialMedia: v.optional(personSchema.entries.socialMedia, DEFAULT_SOCIAL_MEDIA),
	externalId: v.optional(personSchema.entries.externalId),
	profilePicture: v.optional(personSchema.entries.profilePicture)
});
export type CreatePerson = v.InferInput<typeof createPerson>;
export const createPersonZero = v.pipe(
	v.object({
		...createPerson.entries,
		dateOfBirth: v.optional(v.nullable(helpers.unixTimestamp), null)
	}),
	v.check((input) => {
		if (!input.emailAddress && !input.phoneNumber) {
			return false;
		}
		return true;
	}, 'Either one of email or phone number is required'),
	v.check((input) => {
		if (!input.givenName && !input.familyName) {
			return false;
		}
		return true;
	}, 'Either one of given name or family name is required')
);
export type CreatePersonZero = v.InferOutput<typeof createPersonZero>;
export const createPersonRest = v.object({
	...createPerson.entries,
	dateOfBirth: v.optional(v.nullable(helpers.dateToTimestamp), null)
});
export type CreatePersonRest = v.InferOutput<typeof createPersonRest>;

export const updatePerson = v.partial(createPerson);
export type UpdatePerson = v.InferInput<typeof updatePerson>;

export const updatePersonZero = v.object({
	...updatePerson.entries,
	dateOfBirth: v.optional(v.nullable(helpers.unixTimestamp))
});
export type UpdatePersonZero = v.InferOutput<typeof updatePersonZero>;
export const updatePersonRest = v.object({
	...updatePerson.entries,
	dateOfBirth: v.nullable(helpers.dateStringToDate)
});
export type UpdatePersonRest = v.InferOutput<typeof updatePersonRest>;

export const mutatorMetadata = v.object({
	organizationId: personSchema.entries.organizationId,
	personId: personSchema.entries.id,
	teamId: v.optional(helpers.uuid),
	addedFrom: personSchema.entries.addedFrom
});
export type MutatorMetadata = v.InferOutput<typeof mutatorMetadata>;

export const createMutatorSchema = v.object({
	input: createPerson,
	metadata: mutatorMetadata
});
export const createMutatorSchemaZero = v.object({
	input: createPersonZero,
	metadata: mutatorMetadata
});
export const createMutatorSchemaRest = v.object({
	input: createPersonRest,
	metadata: mutatorMetadata
});
export type CreateMutatorSchemaInput = v.InferInput<typeof createMutatorSchema>;
export type CreateMutatorSchemaOutput = v.InferOutput<typeof createMutatorSchema>;
export type CreateMutatorSchemaZeroInput = v.InferInput<typeof createMutatorSchemaZero>;
export type CreateMutatorSchemaZeroOutput = v.InferOutput<typeof createMutatorSchemaZero>;
export type CreateMutatorSchemaRestInput = v.InferInput<typeof createMutatorSchemaRest>;
export type CreateMutatorSchemaRestOutput = v.InferOutput<typeof createMutatorSchemaRest>;

export const updateMutatorSchema = v.object({
	input: updatePerson,
	metadata: v.omit(mutatorMetadata, ['addedFrom'])
});
export const updateMutatorSchemaZero = v.object({
	input: updatePersonZero,
	metadata: v.omit(mutatorMetadata, ['addedFrom'])
});
export const updateMutatorSchemaRest = v.object({
	input: updatePersonRest,
	metadata: v.omit(mutatorMetadata, ['addedFrom'])
});
export type UpdateMutatorSchemaInput = v.InferInput<typeof updateMutatorSchema>;
export type UpdateMutatorSchemaOutput = v.InferOutput<typeof updateMutatorSchema>;
export type UpdateMutatorSchemaZeroInput = v.InferInput<typeof updateMutatorSchemaZero>;
export type UpdateMutatorSchemaZeroOutput = v.InferOutput<typeof updateMutatorSchemaZero>;
export type UpdateMutatorSchemaRestInput = v.InferInput<typeof updateMutatorSchemaRest>;
export type UpdateMutatorSchemaRestOutput = v.InferOutput<typeof updateMutatorSchemaRest>;

export const deleteMutatorSchemaZero = v.object({
	metadata: v.omit(mutatorMetadata, ['addedFrom'])
});
export type DeleteMutatorSchemaZero = v.InferOutput<typeof deleteMutatorSchemaZero>;

export const personTeamMutatorMetadata = v.object({
	organizationId: helpers.uuid,
	personId: helpers.uuid,
	teamId: helpers.uuid
});
export type PersonTeamMutatorMetadata = v.InferOutput<typeof personTeamMutatorMetadata>;

export const addPersonToTeamMutatorSchemaZero = v.object({
	metadata: personTeamMutatorMetadata
});
export type AddPersonToTeamMutatorSchemaZero = v.InferOutput<
	typeof addPersonToTeamMutatorSchemaZero
>;

export const removePersonFromTeamMutatorSchemaZero = v.object({
	metadata: personTeamMutatorMetadata
});
export type RemovePersonFromTeamMutatorSchemaZero = v.InferOutput<
	typeof removePersonFromTeamMutatorSchemaZero
>;

export const personTagMutatorMetadata = v.object({
	organizationId: helpers.uuid,
	personId: helpers.uuid,
	tagId: helpers.uuid
});
export type PersonTagMutatorMetadata = v.InferOutput<typeof personTagMutatorMetadata>;

export const addPersonTagMutatorSchemaZero = v.object({
	metadata: personTagMutatorMetadata
});
export type AddPersonTagMutatorSchemaZero = v.InferOutput<typeof addPersonTagMutatorSchemaZero>;

export const removePersonTagMutatorSchemaZero = v.object({
	metadata: personTagMutatorMetadata
});
export type RemovePersonTagMutatorSchemaZero = v.InferOutput<
	typeof removePersonTagMutatorSchemaZero
>;

export const personActionHelper = v.pipe(
	v.object({
		givenName: v.optional(v.nullable(personSchema.entries.givenName)),
		familyName: v.optional(v.nullable(personSchema.entries.familyName)),
		//WhatsApp flow sends empty strings for empty fields, so we need to handle that
		emailAddress: v.optional(
			v.pipe(
				v.union([v.string(), v.null()]),
				v.transform((val) => {
					if (val === '') return null;
					return val;
				}),
				v.nullable(personSchema.entries.emailAddress)
			)
		),
		phoneNumber: v.optional(v.nullable(personSchema.entries.phoneNumber)),
		subscribed: v.optional(personSchema.entries.subscribed, true),
		profilePicture: v.optional(v.nullable(personSchema.entries.profilePicture)),
		addressLine1: v.optional(v.nullable(personSchema.entries.addressLine1)),
		addressLine2: v.optional(v.nullable(personSchema.entries.addressLine2)),
		locality: v.optional(v.nullable(personSchema.entries.locality)),
		region: v.optional(v.nullable(personSchema.entries.region)),
		postcode: v.optional(v.nullable(personSchema.entries.postcode)),
		country: personSchema.entries.country,
		preferredLanguage: v.optional(v.nullable(personSchema.entries.preferredLanguage)),
		gender: v.optional(v.nullable(personSchema.entries.gender)),
		dateOfBirth: v.optional(v.nullable(personSchema.entries.dateOfBirth)),
		workplace: v.optional(v.nullable(personSchema.entries.workplace)),
		position: v.optional(v.nullable(personSchema.entries.position))
	}),
	v.check((input) => {
		//console.log('checking email or phone number', input, !input.emailAddress && !input.phoneNumber);
		if (!input.emailAddress && !input.phoneNumber) {
			return false;
		}
		return true;
	}, 'Either one of email or phone number is required'),
	v.check((input) => {
		//console.log('checking given name or family name', input, !input.givenName && !input.familyName);
		if (!input.givenName && !input.familyName) {
			return false;
		}
		return true;
	}, 'Either one of given name or family name is required')
);
export type PersonActionHelper = v.InferOutput<typeof personActionHelper>;

export const personActionHelperWhatsAppFlow = v.object({
	...personActionHelper.entries,
	flow_token: v.literal('unused'),
	resource_type: v.picklist(['event', 'petition', 'survey', 'other']),
	resource_id: helpers.uuid
});

export const customFieldValue = v.union([v.string(), v.number(), v.boolean(), v.array(v.string())]);
type CustomFieldValue = v.InferOutput<typeof customFieldValue>;
export const personActionHelperCustom = v.record(helpers.uuid, customFieldValue);

export const personActionHelperCustomFieldsOnly = v.pipe(
	v.record(v.string(), customFieldValue),
	v.transform((obj) => {
		const result: Record<string, CustomFieldValue> = {};
		for (const [key, value] of Object.entries(obj)) {
			try {
				// Validate the key; if invalid, skip it
				v.parse(helpers.uuid, key);
				result[key] = value;
			} catch {
				// skip invalid keys
			}
		}
		return result;
	})
);

export function setRequiredPersonActionHelperFieldsBasedOnSurveyQuestions(
	schema: typeof personActionHelper,
	questions: SurveyQuestion[]
) {
	const questionTypes = questions.map((question) => question.type);
	const newSchema = v.object({
		...schema.entries,
		...(questionTypes.includes('person.dateOfBirth') ? { dateOfBirth: helpers.pastDate } : {}),
		...(questionTypes.includes('person.gender') ? { gender: helpers.gender } : {}),
		...(questionTypes.includes('person.workplace') ? { workplace: helpers.mediumStringEmpty } : {}),
		...(questionTypes.includes('person.position') ? { position: helpers.mediumStringEmpty } : {}),
		...(questionTypes.includes('person.address')
			? {
					addressLine1: helpers.mediumStringEmpty,
					addressLine2: v.optional(helpers.mediumStringEmpty),
					locality: v.optional(helpers.mediumStringEmpty),
					region: v.optional(helpers.mediumStringEmpty),
					postcode: v.optional(helpers.mediumStringEmpty),
					country: helpers.countryCode
				}
			: {})
	});
	return newSchema;
}
