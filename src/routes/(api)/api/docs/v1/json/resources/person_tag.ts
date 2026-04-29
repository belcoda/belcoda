import { addPersonTagApiBody, tagApiSchema } from '$lib/schema/tag';
import { buildListEnvelopeSchema, generateOpenSchemaFromValibot } from '../utils';
import { params } from '../params';

export async function buildPersonTagResourceSpec() {
	const [tagOpenApiSchema, addPersonTagRequestOpenApiSchema] = await Promise.all([
		generateOpenSchemaFromValibot(tagApiSchema),
		generateOpenSchemaFromValibot(addPersonTagApiBody)
	]);

	return {
		tags: [{ name: 'Person Tags' }],
		paths: {
			'/api/v1/person/{personId}/tags': {
				get: {
					tags: ['Person Tags'],
					summary: 'List person tags',
					parameters: [...params.personId, ...params.list],
					responses: {
						'200': {
							description: 'List of person tags',
							content: {
								'application/json': {
									schema: { $ref: '#/components/schemas/PersonTagListResponse' }
								}
							}
						},
						'400': { $ref: '#/components/responses/BadRequest' },
						'401': { $ref: '#/components/responses/Unauthorized' },
						'500': { $ref: '#/components/responses/InternalServerError' }
					}
				},
				post: {
					tags: ['Person Tags'],
					summary: 'Add tag to person',
					parameters: params.personId,
					requestBody: {
						required: true,
						content: {
							'application/json': {
								schema: { $ref: '#/components/schemas/AddPersonTagRequest' }
							}
						}
					},
					responses: {
						'200': {
							description: 'Tag added to person',
							content: {
								'application/json': {
									schema: { $ref: '#/components/schemas/Tag' }
								}
							}
						},
						'400': { $ref: '#/components/responses/BadRequest' },
						'401': { $ref: '#/components/responses/Unauthorized' },
						'500': { $ref: '#/components/responses/InternalServerError' }
					}
				}
			},
			'/api/v1/person/{personId}/tags/{tagId}': {
				delete: {
					tags: ['Person Tags'],
					summary: 'Remove tag from person',
					parameters: params.personAndTagId,
					responses: {
						'204': { description: 'Tag removed from person' },
						'401': { $ref: '#/components/responses/Unauthorized' },
						'500': { $ref: '#/components/responses/InternalServerError' }
					}
				}
			}
		},
		schemas: {
			Tag: tagOpenApiSchema,
			AddPersonTagRequest: addPersonTagRequestOpenApiSchema,
			PersonTagListResponse: buildListEnvelopeSchema('#/components/schemas/Tag')
		}
	};
}
