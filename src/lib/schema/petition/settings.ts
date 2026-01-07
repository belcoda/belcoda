import {
	picklist,
	object,
	array,
	type InferOutput,
	fallback,
	string,
	nullable,
	boolean,
	record,
	unknown
} from 'valibot';

const fieldTypeSchema = picklist(['text', 'number', 'date', 'boolean', 'select', 'multi-select']);

export const petitionSettingsSchema = object({
	signupFields: fallback(
		object({
			standard: fallback(array(string()), []),
			custom: fallback(
				array(
					object({
						id: string(),
						label: string(),
						type: fieldTypeSchema,
						required: boolean(),
						options: nullable(array(string()))
					})
				),
				[]
			)
		}),
		{ standard: [], custom: [] }
	),
	tags: fallback(array(string()), []) // Array of tag IDs to auto-apply to signers
});
export type PetitionSettingsSchema = InferOutput<typeof petitionSettingsSchema>;

export const petitionSignatureDetails = object({
	channel: object({
		type: picklist(['petitionPage', 'adminPanel', 'whatsapp'])
	}),
	customFields: fallback(record(string(), unknown()), {})
});
export type PetitionSignatureDetails = InferOutput<typeof petitionSignatureDetails>;
