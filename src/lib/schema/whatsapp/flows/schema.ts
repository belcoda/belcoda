import {
	object,
	string,
	array,
	optional,
	boolean,
	number,
	union,
	literal,
	fallback,
	record,
	unknown,
	picklist,
	nullable,
	type InferOutput,
	type InferInput
} from 'valibot';
import { shortString, uuid } from '$lib/schema/helpers';
import type { WhatsAppFlowScreen } from '$lib/schema/whatsapp/ycloud/flow_json_types';
/**
 * WhatsApp Flows Survey Schema v7.2
 *
 * This schema defines the structure for storing survey questions and validation
 * information that can be converted to WhatsApp Flows JSON format.
 */

// supported component types
export const whatsappFlowComponentType = picklist([
	'TextInput',
	'TextArea',
	'RadioButtonsGroup',
	'CheckboxGroup',
	'DatePicker',
	'OptIn'
]);

// Input types for TextInput component
export const textInputType = picklist(['text', 'email', 'phone', 'number', 'password']);

// Base field schema
const baseFieldSchema = object({
	id: string(),
	label: shortString,
	required: fallback(boolean(), false),
	visible: fallback(boolean(), true),
	helperText: optional(nullable(shortString))
});

// TextInput field schema
export const textInputFieldSchema = object({
	...baseFieldSchema.entries,
	type: literal('TextInput'),
	inputType: fallback(textInputType, 'text'),
	minChars: optional(number()),
	maxChars: optional(number()),
	pattern: optional(string()), // Regex pattern for validation if we need it
	initValue: optional(string())
});

// TextArea field schema
export const textAreaFieldSchema = object({
	...baseFieldSchema.entries,
	type: literal('TextArea'),
	maxLength: optional(number()),
	initValue: optional(string())
});

// RadioButtonsGroup field schema
export const radioButtonsGroupFieldSchema = object({
	...baseFieldSchema.entries,
	type: literal('RadioButtonsGroup'),
	options: array(
		object({
			id: string(),
			title: shortString,
			description: optional(shortString)
		})
	),
	initValue: optional(string()) // ID of initially selected option
});

// CheckboxGroup field schema
export const checkboxGroupFieldSchema = object({
	...baseFieldSchema.entries,
	type: literal('CheckboxGroup'),
	options: array(
		object({
			id: string(),
			title: shortString,
			description: optional(shortString)
		})
	),
	minSelectedItems: optional(number()),
	maxSelectedItems: optional(number()),
	initValue: optional(array(string())) // Array of initially selected option IDs
});

// DatePicker field schema
export const datePickerFieldSchema = object({
	...baseFieldSchema.entries,
	type: literal('DatePicker'),
	minDate: optional(string()), // ISO date string
	maxDate: optional(string()), // ISO date string
	unavailableDates: optional(array(string())), // Array of ISO date strings
	initValue: optional(string()) // ISO date string
});

// OptIn field schema (for boolean/checkbox)
export const optInFieldSchema = object({
	...baseFieldSchema.entries,
	type: literal('OptIn'),
	initValue: optional(boolean())
});

// Union of all field types
export const whatsappFlowFieldSchema = union([
	textInputFieldSchema,
	textAreaFieldSchema,
	radioButtonsGroupFieldSchema,
	checkboxGroupFieldSchema,
	datePickerFieldSchema,
	optInFieldSchema
]);

export type WhatsappFlowFieldSchema = InferOutput<typeof whatsappFlowFieldSchema>;

// Screen schema - represents a single screen/page in the flow
export const whatsappFlowScreenSchema = object({
	id: string(),
	title: shortString,
	description: optional(shortString),
	fields: array(whatsappFlowFieldSchema)
});

export type WhatsappFlowScreenSchema = InferOutput<typeof whatsappFlowScreenSchema>;

// Main survey schema
export const whatsappFlowSurveySchema = object({
	version: fallback(string(), '7.2'),
	metadata: object({
		id: uuid,
		title: shortString,
		description: optional(shortString),
		createdAt: number(),
		updatedAt: number(),
		sourceEventId: optional(uuid), // ID of the event if this was converted from event signup fields
		sourcePetitionId: optional(uuid), // ID of the petition if this was converted from petition signup fields
		organizationId: uuid,
		ycloudFlowId: optional(string()) // Flow ID returned from YCloud after deployment
	}),
	screens: array(whatsappFlowScreenSchema)
});

export type WhatsappFlowSurveySchema = InferOutput<typeof whatsappFlowSurveySchema>;
export type InsertWhatsappFlowSurveySchema = InferInput<typeof whatsappFlowSurveySchema>;

export const whatsappFlowInternalSchema = object({
	version: string(),
	data_api_version: optional(string()),
	routing_model: optional(record(string(), array(string()))),
	screens: array(whatsappFlowScreenSchema),
	metadata: object({
		id: uuid,
		title: shortString,
		description: optional(shortString),
		createdAt: number(),
		updatedAt: number(),
		sourceEventId: optional(uuid), // ID of the event if this was converted from event signup fields
		sourcePetitionId: optional(uuid), // ID of the petition if this was converted from petition signup fields
		organizationId: uuid,
		ycloudFlowId: optional(string()) // Flow ID returned from YCloud after deployment
	})
});

export type WhatsappFlowInternalSchema = InferOutput<typeof whatsappFlowInternalSchema>;
// this is basically the WhatsApp Official JSON + Our Metadata
export interface WhatsappFlowInternal {
	version: string; // '7.2'
	data_api_version?: string; // '3.0' for flows with data exchange endpoint
	routing_model?: Record<string, string[]>; // Screen routing for endpoint-powered flows
	screens: WhatsAppFlowScreen[];
	// Additional metadata for internal use only (not sent to WhatsApp)
	metadata: {
		id: string; // UUID
		title: string;
		description?: string;
		createdAt: number; // timestamp
		updatedAt: number; // timestamp
		sourceEventId?: string; // UUID of event if this came from event signup fields
		sourcePetitionId?: string; // UUID of petition if this came from petition signup fields
		organizationId: string; // UUID
		ycloudFlowId?: string; // Flow ID returned from YCloud after deployment
	};
}

// Predefined fields for common use cases
export const predefinedFieldTemplates = {
	// Standard person fields
	givenName: (): InferOutput<typeof textInputFieldSchema> => ({
		id: 'givenName',
		type: 'TextInput',
		label: 'First Name',
		inputType: 'text',
		required: true,
		visible: true,
		maxChars: 50
	}),

	familyName: (): InferOutput<typeof textInputFieldSchema> => ({
		id: 'familyName',
		type: 'TextInput',
		label: 'Last Name',
		inputType: 'text',
		required: true,
		visible: true,
		maxChars: 50
	}),

	emailAddress: (): InferOutput<typeof textInputFieldSchema> => ({
		id: 'emailAddress',
		type: 'TextInput',
		label: 'Email Address',
		inputType: 'email',
		required: true,
		visible: true,
		maxChars: 100
	}),

	phoneNumber: (): InferOutput<typeof textInputFieldSchema> => ({
		id: 'phoneNumber',
		type: 'TextInput',
		label: 'Phone Number',
		inputType: 'phone',
		required: false,
		visible: true
	}),

	dateOfBirth: (): InferOutput<typeof datePickerFieldSchema> => ({
		id: 'dateOfBirth',
		type: 'DatePicker',
		label: 'Date of Birth',
		required: false,
		visible: true,
		maxDate: new Date().toISOString().split('T')[0] // Today
	}),

	gender: (): InferOutput<typeof radioButtonsGroupFieldSchema> => ({
		id: 'gender',
		type: 'RadioButtonsGroup',
		label: 'Gender',
		required: false,
		visible: true,
		options: [
			{ id: 'male', title: 'Male' },
			{ id: 'female', title: 'Female' },
			{ id: 'other', title: 'Other' },
			{ id: 'prefer-not-to-say', title: 'Prefer not to say' }
		]
	}),

	organization: (): InferOutput<typeof textInputFieldSchema> => ({
		id: 'organization',
		type: 'TextInput',
		label: 'Organization',
		inputType: 'text',
		required: false,
		visible: true,
		maxChars: 100
	})
};

export function convertEventFieldToWhatsappField(eventField: {
	id: string;
	label: string;
	type: 'text' | 'number' | 'date' | 'boolean' | 'select' | 'multi-select';
	required: boolean;
	options: string[] | null;
}): WhatsappFlowFieldSchema {
	const baseField = {
		id: eventField.id,
		label: eventField.label,
		required: eventField.required,
		visible: true,
		originalFieldType: eventField.type
	};

	switch (eventField.type) {
		case 'text':
			return {
				...baseField,
				type: 'TextInput',
				inputType: 'text',
				maxChars: 200
			} as InferOutput<typeof textInputFieldSchema>;

		case 'number':
			return {
				...baseField,
				type: 'TextInput',
				inputType: 'number'
			} as InferOutput<typeof textInputFieldSchema>;

		case 'date':
			return {
				...baseField,
				type: 'DatePicker'
			} as InferOutput<typeof datePickerFieldSchema>;

		case 'boolean':
			return {
				...baseField,
				type: 'OptIn'
			} as InferOutput<typeof optInFieldSchema>;

		case 'select':
			return {
				...baseField,
				type: 'RadioButtonsGroup',
				options: (eventField.options || []).map((option, index) => ({
					id: `option_${index}`,
					title: option
				}))
			} as InferOutput<typeof radioButtonsGroupFieldSchema>;

		case 'multi-select':
			return {
				...baseField,
				type: 'CheckboxGroup',
				options: (eventField.options || []).map((option, index) => ({
					id: `option_${index}`,
					title: option
				}))
			} as InferOutput<typeof checkboxGroupFieldSchema>;

		default:
			// Fallback to text input
			return {
				...baseField,
				type: 'TextInput',
				inputType: 'text'
			} as InferOutput<typeof textInputFieldSchema>;
	}
}

export const FlowResponseDataSchema = object({
	flowToken: string(),
	flowId: string(),
	from: string(),
	response: record(string(), record(string(), unknown())), // {screenId: {fieldId: value}},
	eventId: optional(string())
});

export type FlowResponseData = InferOutput<typeof FlowResponseDataSchema>;

export const ycloudFlowResponseSchema = object({
	id: optional(string()), // Only present for create operations
	success: boolean()
});
