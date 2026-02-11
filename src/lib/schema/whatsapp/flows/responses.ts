import {
	object,
	array,
	string,
	unknown,
	type InferOutput,
	optional,
	union,
	literal
} from 'valibot';

/**
 * Unified Flow Response Schema
 *
 * This schema defines a standardized format for storing responses from all types of surveys:
 * - WhatsApp Flow responses
 * - Web form responses
 * - Event signup responses
 * - Future petition responses
 * - Any other survey-like interactions
 *
 * The format is designed to be simple and compatible with WhatsApp Flows limitations
 * while being flexible enough for all response types.
 */

// Individual response value. can be various types based on field type
export const responseValueSchema = union([
	string(), // Text, email, phone, date (ISO string), single select option ID
	array(string()), // Multi-select option IDs
	unknown() // For any other complex data types we might experience in the future
]);

// Individual field response
export const fieldResponseSchema = object({
	fieldId: optional(string()), // The ID of the field that was answered
	fieldType: optional(string()), // the type of field (for context)
	value: responseValueSchema, // The actual response value
	label: optional(string())
});

// Response metadata
export const responseMetadataSchema = object({
	channel: union([
		literal('whatsapp_flow'),
		literal('web_form')
		// We can add other channels or sources here as required e.g api, etc
	]),
	submittedAt: string()
});

// Main flow responses schema
// Note: response_json uses unknown() to support different formats:
// - WhatsApp Flows send flat objects: { fullName: "...", email: "...", resource_type: "event" }
// - Web forms may send structured arrays: [{ fieldId: "...", value: "..." }]
export const flowResponsesSchema = object({
	name: optional(string()),
	body: optional(string()),
	response_json: unknown() // Accept any structure - validated at runtime based on channel
});

// We want to save the responses and the metadata in the same column
export const flowResponsesDBSchema = object({
	...flowResponsesSchema.entries,
	...responseMetadataSchema.entries
});

export type FlowResponses = InferOutput<typeof flowResponsesSchema>;
export type FieldResponse = InferOutput<typeof fieldResponseSchema>;
export type ResponseValue = InferOutput<typeof responseValueSchema>;
export type ResponseMetadata = InferOutput<typeof responseMetadataSchema>;
export type FlowResponsesDB = InferOutput<typeof flowResponsesDBSchema>;

/**
 * Helper function to create a field response
 */
export function createFieldResponse(
	value: ResponseValue,
	fieldId?: string,
	options?: {
		fieldType?: string;
		label?: string;
	}
): FieldResponse {
	return {
		value,
		...(fieldId && { fieldId }),
		...(options?.fieldType && { fieldType: options.fieldType }),
		...(options?.label && { label: options.label })
	};
}
