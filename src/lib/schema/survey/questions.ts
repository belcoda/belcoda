import * as v from 'valibot';
import * as helpers from '$lib/schema/helpers';
import type { Locale } from '$lib/utils/language';

import {
	type PersonActionHelper,
	personActionHelper,
	setRequiredPersonActionHelperFieldsBasedOnSurveyQuestions
} from '$lib/schema/person';

export const surveyQuestionTypes = [
	'person.dateOfBirth',
	'person.gender',
	'person.workplace',
	'person.position',
	'person.address',
	'custom.textInput',
	'custom.textarea',
	'custom.dateInput',
	'custom.checkboxGroup',
	'custom.radioGroup',
	'custom.dropdown',
	'custom.emailInput',
	'custom.phoneInput',
	'custom.numberInput'
] as const;

export const surveyQuestionTypeSchema = v.picklist(surveyQuestionTypes);
import type { EventSchema } from '$lib/schema/event';
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
		type: v.literal('custom.textInput'),
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

export function convertQuestionsToValibotSchema(questions: SurveyQuestion[]) {
	const result = questions.reduce(
		(accumulator, question, index, array) => {
			const schema = getSchemaForQuestion(question);
			return {
				...accumulator,
				[question.id]: schema
			};
		},
		{} as Record<string, v.GenericSchema<any, any>>
	);
	return result;
}

function getSchemaForQuestion(question: SurveyQuestion) {
	switch (question.type) {
		case 'custom.dateInput': {
			return helpers.dateString;
		}
		case 'custom.emailInput': {
			return helpers.email;
		}
		case 'custom.phoneInput': {
			return helpers.phoneNumber;
		}
		case 'custom.numberInput': {
			return v.number();
		}
		case 'person.dateOfBirth': {
			return v.date();
		}
		case 'custom.checkboxGroup': {
			const options = question.options ?? [];
			return v.array(v.picklist(options));
		}
		case 'person.gender': {
			return helpers.gender;
		}
		case 'person.address': {
			return helpers.address;
		}
		case 'custom.dropdown':
		case 'custom.radioGroup':
			return v.picklist(question.options);
		default:
			return helpers.mediumString;
	}
}

export function renderQuestionTypeName(questionType: SurveyQuestionType, locale: Locale): string {
	switch (questionType) {
		case 'person.dateOfBirth':
			return 'Date of Birth';
		case 'person.gender':
			return 'Gender';
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
		case 'custom.emailInput':
			return 'Email';
		case 'custom.phoneInput':
			return 'Phone';
		case 'custom.numberInput':
			return 'Number';
		default:
			return questionType;
	}
}

export const surveyQuestionResponse = v.record(
	helpers.uuid,
	v.union([helpers.longString, v.number(), v.boolean(), v.array(helpers.longString)])
);
export type SurveyQuestionResponse = v.InferOutput<typeof surveyQuestionResponse>;

export function getSurveySchema(eventObj: EventSchema) {
	const survey = eventObj.settings.survey?.collections?.[0]?.questions ?? [];
	const customSurveyQuestions = survey.filter((question) => question.type.startsWith('custom.'));
	const personSurveyQuestions = survey
		.filter((question) => question.type.startsWith('person.'))
		.map((item) => item.type);
	const customQuestionSurveySchema = v.object(
		convertQuestionsToValibotSchema(customSurveyQuestions)
	);
	const personActionHelperSchema = setRequiredPersonActionHelperFieldsBasedOnSurveyQuestions(
		personActionHelper,
		customSurveyQuestions
	);
	return v.object({
		theme: v.optional(v.picklist(['default', 'embed'])),
		person: personActionHelperSchema,
		customFields: customQuestionSurveySchema
	});
}

export type SurveySchema = v.InferOutput<ReturnType<typeof getSurveySchema>>;
