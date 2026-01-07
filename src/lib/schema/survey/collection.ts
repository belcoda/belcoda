import * as v from 'valibot';
import * as helpers from '$lib/schema/helpers';
import { surveyQuestionSchema, type SurveyQuestionType } from '$lib/schema/survey/questions';

export const surveyCollectionSchema = v.pipe(
	v.object({
		id: helpers.uuid,
		title: helpers.shortString,
		description: v.optional(v.nullable(helpers.mediumString)),
		questions: v.array(surveyQuestionSchema),
		nextCollectionId: v.optional(v.nullable(helpers.uuid)),
		previousCollectionId: v.optional(v.nullable(helpers.uuid))
	})
);
export type SurveyCollection = v.InferOutput<typeof surveyCollectionSchema>;

export const surveySchema = v.object({
	schemaVersion: v.literal('1.0.0'),
	collections: v.array(surveyCollectionSchema)
});
export type Survey = v.InferOutput<typeof surveySchema>;
