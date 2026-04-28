import {
	picklist,
	object,
	array,
	type InferOutput,
	fallback,
	string,
	optional,
	nullable
} from 'valibot';
import { shortString, unixTimestamp } from '$lib/schema/helpers';
import { surveySchema } from '$lib/schema/survey/collection';
import { v4 as uuidv4 } from 'uuid';

export const petitionSettingsSchema = object({
	survey: surveySchema,
	tags: fallback(array(string()), []), // Array of tag IDs to auto-apply to signers
	whatsappFlowId: optional(nullable(shortString), null),
	whatsappFlowYCloudId: optional(nullable(shortString), null),
	whatsappFlowCreatedAt: optional(nullable(unixTimestamp), null)
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
		tags: [],
		whatsappFlowId: null,
		whatsappFlowYCloudId: null,
		whatsappFlowCreatedAt: null
	};
}

export const petitionSignatureDetails = object({
	channel: object({
		type: picklist(['petitionPage', 'adminPanel', 'whatsapp'])
	})
});
export type PetitionSignatureDetails = InferOutput<typeof petitionSignatureDetails>;
