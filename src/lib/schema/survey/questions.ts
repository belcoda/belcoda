import * as v from 'valibot';
import * as helpers from '$lib/schema/helpers';

export const surveyQuestionTypes = [
	'person.givenName',
	'person.familyName',
	'person.emailAddress',
	'person.phoneNumber',
	'person.dateOfBirth',
	'person.gender',
	'person.country',
	'person.preferredLanguage',
	'person.workplace',
	'person.position',
	'person.addressLine1',
	'person.addressLine2',
	'person.locality',
	'person.region',
	'person.postcode',
	'custom.textInput',
	'custom.emailInput',
	'custom.phoneInput',
	'custom.numberInput',
	'custom.dateInput',
	'custom.textarea',
	'custom.checkboxGroup',
	'custom.imageUpload',
	'custom.documentUpload',
	'custom.radioGroup',
	'custom.dropdown'
] as const;
export const surveyQuestionTypeSchema = v.picklist(surveyQuestionTypes);

export const surveyQuestionBase = v.object({
	id: helpers.uuid,
	type: surveyQuestionTypeSchema,
	label: helpers.shortString,
	description: v.optional(helpers.mediumString),
	required: v.boolean()
});

export const surveyQuestionTypeSchemas = [
	v.object({
		...surveyQuestionBase.entries,
		type: v.literal('person.givenName')
	}),
	v.object({
		...surveyQuestionBase.entries,
		type: v.literal('person.familyName')
	}),
	v.object({
		...surveyQuestionBase.entries,
		type: v.literal('person.emailAddress')
	}),
	v.object({
		...surveyQuestionBase.entries,
		type: v.literal('person.phoneNumber')
	}),
	v.object({
		...surveyQuestionBase.entries,
		type: v.literal('person.dateOfBirth')
	}),
	v.object({
		...surveyQuestionBase.entries,
		type: v.literal('person.gender')
	}),
	v.object({
		...surveyQuestionBase.entries,
		type: v.literal('person.country')
	}),
	v.object({
		...surveyQuestionBase.entries,
		type: v.literal('person.preferredLanguage')
	}),
	v.object({
		...surveyQuestionBase.entries,
		type: v.literal('person.workplace')
	}),
	v.object({
		...surveyQuestionBase.entries,
		type: v.literal('person.position')
	}),
	v.object({
		...surveyQuestionBase.entries,
		type: v.literal('person.addressLine1')
	}),
	v.object({
		...surveyQuestionBase.entries,
		type: v.literal('person.addressLine2')
	}),
	v.object({
		...surveyQuestionBase.entries,
		type: v.literal('person.locality')
	}),
	v.object({
		...surveyQuestionBase.entries,
		type: v.literal('person.region')
	}),
	v.object({
		...surveyQuestionBase.entries,
		type: v.literal('person.postcode')
	}),
	v.object({
		...surveyQuestionBase.entries,
		type: v.literal('custom.textInput'),
		placeholder: v.optional(helpers.shortString),
		maxLength: v.optional(helpers.count),
		minLength: v.optional(helpers.count),
		regexp: v.optional(helpers.shortString),
		customErrorMessage: v.optional(helpers.shortString)
	}),
	v.object({
		...surveyQuestionBase.entries,
		type: v.literal('custom.emailInput')
	}),
	v.object({
		...surveyQuestionBase.entries,
		type: v.literal('custom.phoneInput')
	}),
	v.object({
		...surveyQuestionBase.entries,
		type: v.literal('custom.numberInput')
	}),
	v.object({
		...surveyQuestionBase.entries,
		type: v.literal('custom.dateInput')
	}),
	v.object({
		...surveyQuestionBase.entries,
		type: v.literal('custom.textarea'),
		maxLength: v.optional(helpers.count),
		minLength: v.optional(helpers.count),
		regexp: v.optional(helpers.shortString),
		customErrorMessage: v.optional(helpers.shortString)
	}),
	v.object({
		...surveyQuestionBase.entries,
		type: v.literal('custom.checkboxGroup'),
		options: v.array(helpers.shortString)
	}),
	v.object({
		...surveyQuestionBase.entries,
		type: v.literal('custom.imageUpload')
	}),
	v.object({
		...surveyQuestionBase.entries,
		type: v.literal('custom.documentUpload')
	}),
	v.object({
		...surveyQuestionBase.entries,
		type: v.literal('custom.radioGroup'),
		options: v.array(helpers.shortString)
	}),
	v.object({
		...surveyQuestionBase.entries,
		type: v.literal('custom.dropdown'),
		options: v.array(helpers.shortString)
	})
] as const;

export const surveyQuestionSchema = v.variant('type', surveyQuestionTypeSchemas);
export type SurveyQuestion = v.InferOutput<typeof surveyQuestionSchema>;
