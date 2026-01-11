import { picklist, object, array, type InferOutput, fallback, string } from 'valibot';
import { surveySchema } from '$lib/schema/survey/collection';
import { v4 as uuidv4 } from 'uuid';

export const petitionSettingsSchema = object({
	survey: surveySchema,
	tags: fallback(array(string()), []) // Array of tag IDs to auto-apply to signers
});
export type PetitionSettingsSchema = InferOutput<typeof petitionSettingsSchema>;

export function defaultPetitionSettings(): PetitionSettingsSchema {
	return {
		survey: {
			schemaVersion: '1.0.0',
			collections: [
				{
					id: uuidv4(),
					title: 'Petition information',
					description: null,
					questions: [],
					nextCollectionId: null,
					previousCollectionId: null
				}
			]
		},
		tags: []
	};
}

export const petitionSignatureDetails = object({
	channel: object({
		type: picklist(['petitionPage', 'adminPanel', 'whatsapp'])
	})
});
export type PetitionSignatureDetails = InferOutput<typeof petitionSignatureDetails>;
