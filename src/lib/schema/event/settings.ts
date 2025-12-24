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
import { url, shortString } from '$lib/schema/helpers';

export const signupFieldsSchema = object({
	standard: array(string()),
	custom: array(
		object({
			id: string(),
			label: string(),
			type: fieldTypeSchema,
			required: boolean(),
			options: nullable(array(string()))
		})
	)
});

export const eventSettingsSchema = object({
	displayTimezone: boolean(),
	signupFields: signupFieldsSchema,
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
	})
});
export type EventSignupDetails = InferOutput<typeof eventSignupDetails>;

export const eventSignupStatusList = ['signup', 'attended', 'cancelled', 'noshow'] as const;
export const eventSignupStatus = picklist(eventSignupStatusList);
export type EventSignupStatus = (typeof eventSignupStatusList)[number];
