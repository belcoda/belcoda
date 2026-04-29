import { toJsonSchema } from '@valibot/to-json-schema';
import { convert } from '@openapi-contrib/json-schema-to-openapi-schema';
import { type BaseIssue, type BaseSchema } from 'valibot';

export async function generateOpenSchemaFromValibot(
	input: BaseSchema<unknown, unknown, BaseIssue<unknown>>
) {
	const schema = toJsonSchema(input, { errorMode: 'ignore' });
	return await convert(schema);
}

export function buildListEnvelopeSchema(itemRef: string) {
	return {
		type: 'object',
		required: ['metadata', 'data'],
		properties: {
			metadata: {
				type: 'object',
				required: ['count'],
				properties: {
					count: {
						type: 'number',
						description: 'Total number of matching records'
					}
				},
				additionalProperties: false
			},
			data: {
				type: 'array',
				items: { $ref: itemRef }
			}
		},
		additionalProperties: false
	};
}
