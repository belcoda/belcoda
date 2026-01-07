import * as v from 'valibot';
import * as helpers from '$lib/schema/helpers';

export const surveyQuestionTypes = [
	'person.dateOfBirth',
	'person.gender',
	'person.preferredLanguage',
	'person.workplace',
	'person.position',
	'person.address',
	'custom.textInput',
	'custom.textarea',
	'custom.dateInput',
	'custom.checkboxGroup',
	'custom.radioGroup',
	'custom.dropdown'
] as const;
export const surveyQuestionTypeSchema = v.picklist(surveyQuestionTypes);
export type SurveyQuestionType = v.InferOutput<typeof surveyQuestionTypeSchema>;
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
		type: v.literal('person.dateOfBirth')
	}),
	v.object({
		...surveyQuestionBase.entries,
		type: v.literal('person.gender')
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
		type: v.literal('person.address')
	}),
	v.object({
		...surveyQuestionBase.entries,
		type: v.literal('custom.textInput'),
		format: v.picklist(['text', 'email', 'phone', 'number']),
		placeholder: v.optional(helpers.shortString),
		maxLength: v.optional(helpers.count),
		minLength: v.optional(helpers.count),
		customErrorMessage: v.optional(helpers.shortString)
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

export function renderQuestionTypeName(questionType: SurveyQuestionType, locale: Locale): string {
	switch (questionType) {
		case 'person.dateOfBirth':
			return 'Date of Birth';
		case 'person.gender':
			return 'Gender';
		case 'person.preferredLanguage':
			return 'Preferred Language';
		case 'person.workplace':
			return 'Workplace';
		case 'person.position':
			return 'Position';
		case 'person.address':
			return 'Address';
		case 'custom.textInput':
			return 'Short text';
		case 'custom.textarea':
			return 'Long text';
		case 'custom.dateInput':
			return 'Date';
		case 'custom.checkboxGroup':
			return 'Checkboxes';
		case 'custom.radioGroup':
			return 'Multiple choice';
		case 'custom.dropdown':
			return 'Dropdown';
		default:
			return questionType;
	}
}
