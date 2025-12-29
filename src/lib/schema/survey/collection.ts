import * as v from 'valibot';
import * as helpers from '$lib/schema/helpers';
import { surveyQuestionSchema } from '$lib/schema/survey/questions';

export const surveyCollectionSchema = v.pipe(
	v.object({
		id: helpers.uuid,
		title: helpers.shortString,
		description: helpers.mediumString,
		questions: v.array(surveyQuestionSchema),
		terminal: v.boolean(),
		nextCollectionId: v.nullable(helpers.uuid),
		previousCollectionId: v.nullable(helpers.uuid)
	}),
	v.check((input) => {
		if (!input.terminal && !input.nextCollectionId) {
			return false;
		}
		return true;
	}, 'If a collection is not terminal, it must have a next collection')
);
export type SurveyCollection = v.InferOutput<typeof surveyCollectionSchema>;
