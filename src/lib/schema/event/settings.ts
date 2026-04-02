import {
	picklist,
	object,
	optional,
	array,
	type InferOutput,
	string,
	nullable,
	boolean,
	fallback
} from 'valibot';
const fieldTypeSchema = picklist(['text', 'number', 'date', 'boolean', 'select', 'multi-select']);
import { url, shortString, unixTimestamp } from '$lib/schema/helpers';
import { surveySchema } from '$lib/schema/survey/collection';
import { surveyQuestionResponse } from '$lib/schema/survey/questions';
import { whatsappFlowInternalSchema } from '$lib/schema/whatsapp/flows/schema';

export const eventSettingsSchema = object({
	displayTimezone: boolean(),
	survey: surveySchema,
	whatsappFlowId: optional(nullable(shortString), null),
	whatsappFlowYCloudId: optional(nullable(shortString), null),
	whatsappFlowCreatedAt: optional(nullable(unixTimestamp), null),
	attachments: optional(
		array(
			object({
				link: url,
				title: shortString,
				caption: fallback(nullable(string()), null),
				thumbnail: fallback(nullable(url), null)
			})
		)
	)
});

export type EventSettings = InferOutput<typeof eventSettingsSchema>;

export const eventSignupDetails = object({
	channel: object({
		type: picklist(['eventPage', 'adminPanel', 'whatsapp'])
	}),
	customFields: optional(surveyQuestionResponse, {})
});
export type EventSignupDetails = InferOutput<typeof eventSignupDetails>;

//signup == someone who signed up
//attended == someone who attended
//noshow == someone who signed up but didn't attend
//notattending == someone who responded to an invite by saying they could not attend
//cancelled == someone who signed up but cancelled
//deleted == someone who signed up but was deleted by a user or admin
export const eventSignupStatusList = [
	'incomplete',
	'signup',
	'attended',
	'noshow',
	'notattending',
	'cancelled',
	'deleted'
] as const;
export const eventSignupStatus = picklist(eventSignupStatusList);
export type EventSignupStatus = (typeof eventSignupStatusList)[number];

import { v4 as uuidv4 } from 'uuid';

export function defaultEventSettings(): EventSettings {
	return {
		displayTimezone: true,
		whatsappFlowId: null,
		whatsappFlowYCloudId: null,
		whatsappFlowCreatedAt: null,
		survey: {
			schemaVersion: '1.0.0',
			collections: [
				{
					id: uuidv4(),
					title: 'Event information',
					description: null,
					questions: [],
					nextCollectionId: null,
					previousCollectionId: null
				}
			]
		}
	};
}
