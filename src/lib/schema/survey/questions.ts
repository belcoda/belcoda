import * as v from 'valibot';
import * as helpers from '$lib/schema/helpers';
import type { Locale } from '$lib/utils/language';

import {
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
export type SurveyQuestionType = v.InferOutput<typeof surveyQuestionTypeSchema>;
export const surveyQuestionBase = v.object({
	id: helpers.uuid,
	type: surveyQuestionTypeSchema,
	label: helpers.shortString,
	description: v.optional(v.nullable(helpers.mediumStringEmpty)),
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
		// Survey schemas are dynamically built and heterogeneous (fields output
		// string | number | boolean | Date | string[]). `any` is load-bearing here:
		// switching to `unknown` breaks output inference for every customFields consumer.
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		{} as Record<string, v.GenericSchema<any, any>>
	);
	return result;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- see convertQuestionsToValibotSchema: matches the heterogeneous survey schema output
function requiredOrOptional<TSchema extends v.GenericSchema<any, any>>(
	required: boolean,
	schema: TSchema
) {
	return required ? schema : v.optional(v.nullable(schema));
}

function getSchemaForQuestion(question: SurveyQuestion) {
	const { required } = question;
	switch (question.type) {
		case 'custom.dateInput':
			return requiredOrOptional(required, helpers.dateString);
		case 'custom.emailInput':
			return requiredOrOptional(required, helpers.email);
		case 'custom.phoneInput':
			return requiredOrOptional(required, helpers.phoneNumber);
		case 'custom.numberInput':
			return requiredOrOptional(required, v.number());
		case 'person.dateOfBirth':
			return requiredOrOptional(required, v.date());
		case 'custom.checkboxGroup':
			return requiredOrOptional(required, v.array(v.picklist(question.options ?? [])));
		case 'person.gender':
			return requiredOrOptional(required, helpers.gender);
		case 'person.address':
			return requiredOrOptional(required, helpers.address);
		case 'custom.dropdown':
		case 'custom.radioGroup':
			return requiredOrOptional(required, v.picklist(question.options));
		default:
			return requiredOrOptional(required, helpers.mediumString);
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

type SurveySchemaSource = {
	settings?: {
		phoneNumberRequired?: boolean;
		survey?: {
			collections?: {
				questions?: SurveyQuestion[];
			}[];
		} | null;
	} | null;
};

export function getSurveySchema(eventObj: SurveySchemaSource) {
	const survey = eventObj.settings?.survey?.collections?.[0]?.questions ?? [];
	const customSurveyQuestions = survey.filter((question) => question.type.startsWith('custom.'));
	const customQuestionSurveySchema = v.object(
		convertQuestionsToValibotSchema(customSurveyQuestions)
	);
	const basePersonActionHelperSchema = setRequiredPersonActionHelperFieldsBasedOnSurveyQuestions(
		personActionHelper,
		survey.filter((question) => question.type.startsWith('person.'))
	);
	const personActionHelperSchema = eventObj.settings?.phoneNumberRequired
		? v.object({
				...basePersonActionHelperSchema.entries,
				phoneNumber: helpers.phoneNumber
			})
		: basePersonActionHelperSchema;
	return v.object({
		theme: v.optional(v.picklist(['default', 'embed'])),
		person: personActionHelperSchema,
		customFields: customQuestionSurveySchema
	});
}

export type SurveySchema = v.InferOutput<ReturnType<typeof getSurveySchema>>;
