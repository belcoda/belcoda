import type { Survey } from '$lib/schema/survey/collection';
import type { SurveyQuestionType, SurveyQuestion } from '$lib/schema/survey/questions';
import { v4 as uuidv4 } from 'uuid';
export function addFieldTypeToSurvey(
	survey: Survey,
	type: SurveyQuestionType,
	locale: Locale
): Survey {
	const newCollections =
		survey.collections.length === 0
			? [
					{
						id: uuidv4(),
						title: 'Event information',
						description: null,
						questions: [addQuestion(type, locale)],
						terminal: false,
						nextCollectionId: null,
						previousCollectionId: null
					}
				]
			: survey.collections.map((collection, index) =>
					index === 0
						? { ...collection, questions: [...collection.questions, addQuestion(type, locale)] }
						: collection
				);

	return { ...survey, collections: newCollections };
}

export function removeFieldTypeFromSurvey(survey: Survey, type: SurveyQuestionType): Survey {
	if (survey.collections.length === 0) {
		return survey;
	}

	const newCollections = survey.collections.map((collection, index) =>
		index === 0
			? {
					...collection,
					questions: collection.questions.filter((question) => question.type !== type)
				}
			: collection
	);

	return { ...survey, collections: newCollections };
}

import { renderQuestionTypeName } from '$lib/schema/survey/questions';
import type { Locale } from '$lib/utils/language';
export function addQuestion(type: SurveyQuestionType, locale: Locale): SurveyQuestion {
	const baseQuestion = {
		id: uuidv4(),
		type,
		label: renderQuestionTypeName(type, locale),
		required: true
	};

	switch (type) {
		case 'person.dateOfBirth':
			return {
				...baseQuestion,
				type: 'person.dateOfBirth'
			};

		case 'person.gender':
			return {
				...baseQuestion,
				type: 'person.gender'
			};

		case 'person.workplace':
			return {
				...baseQuestion,
				type: 'person.workplace'
			};

		case 'person.position':
			return {
				...baseQuestion,
				type: 'person.position'
			};

		case 'person.address':
			return {
				...baseQuestion,
				type: 'person.address'
			};

		case 'custom.textInput':
			return {
				...baseQuestion,
				type: 'custom.textInput'
			};

		case 'custom.emailInput':
			return {
				...baseQuestion,
				type: 'custom.emailInput'
			};

		case 'custom.phoneInput':
			return {
				...baseQuestion,
				type: 'custom.phoneInput'
			};

		case 'custom.numberInput':
			return {
				...baseQuestion,
				type: 'custom.numberInput'
			};
		case 'custom.textarea':
			return {
				...baseQuestion,
				type: 'custom.textarea'
			};

		case 'custom.dateInput':
			return {
				...baseQuestion,
				type: 'custom.dateInput'
			};

		case 'custom.checkboxGroup':
			return {
				...baseQuestion,
				type: 'custom.checkboxGroup',
				options: ['Option 1', 'Option 2']
			};

		case 'custom.radioGroup':
			return {
				...baseQuestion,
				type: 'custom.radioGroup',
				options: ['Option 1', 'Option 2']
			};

		case 'custom.dropdown':
			return {
				...baseQuestion,
				type: 'custom.dropdown',
				options: ['Option 1', 'Option 2']
			};
	}
}

function questionHasOptions(questionType: SurveyQuestionType): boolean {
	return (
		questionType === 'custom.checkboxGroup' ||
		questionType === 'custom.radioGroup' ||
		questionType === 'custom.dropdown'
	);
}

export function changeQuestionType({
	survey,
	collectionIndex,
	questionIndex,
	type,
	locale
}: {
	survey: Survey;
	collectionIndex: number;
	questionIndex: number;
	type: SurveyQuestionType;
	locale: Locale;
}): Survey {
	const collection = survey.collections[collectionIndex];
	const question = collection.questions[questionIndex];
	const existingQuestionType = question.type;
	const existingOptions = 'options' in question ? { options: question.options } : {};
	const newOptions = questionHasOptions(type)
		? { options: existingOptions.options || ['Option 1', 'Option 2'] }
		: {};
	const isDefaultLabel = renderQuestionTypeName(existingQuestionType, locale) === question.label;
	const newLabel = isDefaultLabel ? renderQuestionTypeName(type, locale) : question.label;
	survey.collections[collectionIndex].questions[questionIndex] = {
		...question,
		label: newLabel,
		type: type,
		...newOptions
	} as SurveyQuestion;
	return survey;
}

export function getSurveyQuestions(questions: Survey['collections'][number]['questions']): {
	person: SurveyQuestion[];
	custom: SurveyQuestion[];
} {
	return {
		person: questions.filter((question) => question.type.startsWith('person.')),
		custom: questions.filter((question) => question.type.startsWith('custom.'))
	};
}
