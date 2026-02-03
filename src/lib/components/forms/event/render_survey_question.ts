import type { SurveyQuestionType } from '$lib/schema/survey/questions';
import { t } from '$lib/index.svelte';

//This is in a separate module because it should only ever be imported on client side code
export function renderPersonQuestion(question: SurveyQuestionType): string {
	switch (question) {
		case 'person.dateOfBirth':
			return t`Date of Birth`;
		case 'person.gender':
			return t`Gender`;
		case 'person.workplace':
			return t`Workplace`;
		case 'person.position':
			return t`Position`;
		case 'person.address':
			return t`Address`;
		default:
			return question;
	}
}
