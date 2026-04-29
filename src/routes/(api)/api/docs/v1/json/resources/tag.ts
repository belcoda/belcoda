import { createTag, tagApiSchema, updateTag } from '$lib/schema/tag';
import { buildListEnvelopeSchema, generateOpenSchemaFromValibot } from '../utils';
import { params } from '../params';

export async function buildTagResourceSpec() {
	const [tagOpenApiSchema, createTagRequestSchema, updateTagRequestSchema] = await Promise.all([
		generateOpenSchemaFromValibot(tagApiSchema),
		generateOpenSchemaFromValibot(createTag),
		generateOpenSchemaFromValibot(updateTag)
	]);

	return {
		tags: [{ name: 'Tag' }],
		paths: {
			'/api/v1/tags': {
				get: {
					tags: ['Tag'],
					summary: 'List tags',
					parameters: [
						...params.list,
						{
							name: 'includeInactive',
							in: 'query',
							required: false,
							schema: { type: 'boolean' }
						}
					],
					responses: {
						'200': {
							description: 'List of tags',
							content: {
								'application/json': {
									schema: { $ref: '#/components/schemas/TagListResponse' }
								}
							}
						},
						'400': { $ref: '#/components/responses/BadRequest' },
						'401': { $ref: '#/components/responses/Unauthorized' },
						'500': { $ref: '#/components/responses/InternalServerError' }
					}
				},
				post: {
					tags: ['Tag'],
					summary: 'Create tag',
					requestBody: {
						required: true,
						content: {
							'application/json': {
								schema: { $ref: '#/components/schemas/CreateTagRequest' }
							}
						}
					},
					responses: {
						'200': {
							description: 'Created tag',
							content: { 'application/json': { schema: { $ref: '#/components/schemas/Tag' } } }
						},
						'400': { $ref: '#/components/responses/BadRequest' },
						'401': { $ref: '#/components/responses/Unauthorized' },
						'500': { $ref: '#/components/responses/InternalServerError' }
					}
				}
			},
			'/api/v1/tags/{tagId}': {
				get: {
					tags: ['Tag'],
					summary: 'Get tag',
					parameters: params.tagId,
					responses: {
						'200': {
							description: 'Tag',
							content: { 'application/json': { schema: { $ref: '#/components/schemas/Tag' } } }
						},
						'401': { $ref: '#/components/responses/Unauthorized' },
						'500': { $ref: '#/components/responses/InternalServerError' }
					}
				},
				put: {
					tags: ['Tag'],
					summary: 'Update tag',
					parameters: params.tagId,
					requestBody: {
						required: true,
						content: {
							'application/json': {
								schema: { $ref: '#/components/schemas/UpdateTagRequest' }
							}
						}
					},
					responses: {
						'200': {
							description: 'Updated tag',
							content: { 'application/json': { schema: { $ref: '#/components/schemas/Tag' } } }
						},
						'400': { $ref: '#/components/responses/BadRequest' },
						'401': { $ref: '#/components/responses/Unauthorized' },
						'500': { $ref: '#/components/responses/InternalServerError' }
					}
				},
				delete: {
					tags: ['Tag'],
					summary: 'Delete tag',
					parameters: params.tagId,
					responses: {
						'204': { description: 'Tag deleted' },
						'401': { $ref: '#/components/responses/Unauthorized' },
						'500': { $ref: '#/components/responses/InternalServerError' }
					}
				}
			}
		},
		schemas: {
			Tag: tagOpenApiSchema,
			CreateTagRequest: createTagRequestSchema,
			UpdateTagRequest: updateTagRequestSchema,
			TagListResponse: buildListEnvelopeSchema('#/components/schemas/Tag')
		}
	};
}
