import {
	picklist,
	object,
	optional,
	array,
	type InferOutput,
	string,
	nullable,
	boolean
} from 'valibot';
const fieldTypeSchema = picklist(['text', 'number', 'date', 'boolean', 'select', 'multi-select']);

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
	signupFields: signupFieldsSchema
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
