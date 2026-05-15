import { createPetition, petitionApiSchema, updatePetition } from '$lib/schema/petition/petition';
import {
	createPetitionSignatureApiBody,
	petitionSignatureApiSchema,
	updatePetitionSignatureRest
} from '$lib/schema/petition/petition-signature';
import { buildListEnvelopeSchema, generateOpenSchemaFromValibot } from '../utils';
import { params } from '../params';

export async function buildPetitionResourceSpec() {
	const [
		petitionOpenApiSchema,
		createPetitionRequestSchema,
		updatePetitionRequestSchema,
		petitionSignatureOpenApiSchema,
		createPetitionSignatureRequestSchema,
		updatePetitionSignatureRequestSchema
	] = await Promise.all([
		generateOpenSchemaFromValibot(petitionApiSchema),
		generateOpenSchemaFromValibot(createPetition),
		generateOpenSchemaFromValibot(updatePetition),
		generateOpenSchemaFromValibot(petitionSignatureApiSchema),
		generateOpenSchemaFromValibot(createPetitionSignatureApiBody),
		generateOpenSchemaFromValibot(updatePetitionSignatureRest)
	]);

	return {
		tags: [{ name: 'Petition' }, { name: 'Petition Signatures' }],
		paths: {
			'/api/v1/petitions': {
				get: {
					tags: ['Petition'],
					summary: 'List petitions',
					parameters: [
						...params.list,
						{
							name: 'teamId',
							in: 'query',
							required: false,
							schema: { type: 'string', format: 'uuid' }
						},
						{
							name: 'status',
							in: 'query',
							required: false,
							schema: { type: 'string', enum: ['draft', 'published', 'archived'] }
						}
					],
					responses: {
						'200': {
							description: 'List of petitions',
							content: {
								'application/json': {
									schema: { $ref: '#/components/schemas/PetitionListResponse' }
								}
							}
						},
						'400': { $ref: '#/components/responses/BadRequest' },
						'401': { $ref: '#/components/responses/Unauthorized' },
						'500': { $ref: '#/components/responses/InternalServerError' }
					}
				},
				post: {
					tags: ['Petition'],
					summary: 'Create petition',
					requestBody: {
						required: true,
						content: {
							'application/json': {
								schema: { $ref: '#/components/schemas/CreatePetitionRequest' }
							}
						}
					},
					responses: {
						'200': {
							description: 'Created petition',
							content: {
								'application/json': {
									schema: { $ref: '#/components/schemas/Petition' }
								}
							}
						},
						'400': { $ref: '#/components/responses/BadRequest' },
						'401': { $ref: '#/components/responses/Unauthorized' },
						'500': { $ref: '#/components/responses/InternalServerError' }
					}
				}
			},
			'/api/v1/petitions/{petitionId}': {
				get: {
					tags: ['Petition'],
					summary: 'Get petition',
					parameters: params.petitionId,
					responses: {
						'200': {
							description: 'Petition',
							content: { 'application/json': { schema: { $ref: '#/components/schemas/Petition' } } }
						},
						'401': { $ref: '#/components/responses/Unauthorized' },
						'500': { $ref: '#/components/responses/InternalServerError' }
					}
				},
				put: {
					tags: ['Petition'],
					summary: 'Update petition',
					parameters: params.petitionId,
					requestBody: {
						required: true,
						content: {
							'application/json': {
								schema: { $ref: '#/components/schemas/UpdatePetitionRequest' }
							}
						}
					},
					responses: {
						'200': {
							description: 'Updated petition',
							content: { 'application/json': { schema: { $ref: '#/components/schemas/Petition' } } }
						},
						'400': { $ref: '#/components/responses/BadRequest' },
						'401': { $ref: '#/components/responses/Unauthorized' },
						'500': { $ref: '#/components/responses/InternalServerError' }
					}
				},
				delete: {
					tags: ['Petition'],
					summary: 'Delete petition',
					parameters: params.petitionId,
					responses: {
						'204': { description: 'Petition deleted' },
						'401': { $ref: '#/components/responses/Unauthorized' },
						'500': { $ref: '#/components/responses/InternalServerError' }
					}
				}
			},
			'/api/v1/petitions/{petitionId}/signatures': {
				get: {
					tags: ['Petition Signatures'],
					summary: 'List petition signatures',
					parameters: [
						...params.petitionId,
						...params.list,
						{
							name: 'teamId',
							in: 'query',
							required: false,
							schema: { type: 'string', format: 'uuid' }
						},
						{
							name: 'personId',
							in: 'query',
							required: false,
							schema: { type: 'string', format: 'uuid' }
						}
					],
					responses: {
						'200': {
							description: 'List of petition signatures',
							content: {
								'application/json': {
									schema: { $ref: '#/components/schemas/PetitionSignatureListResponse' }
								}
							}
						},
						'400': { $ref: '#/components/responses/BadRequest' },
						'401': { $ref: '#/components/responses/Unauthorized' },
						'500': { $ref: '#/components/responses/InternalServerError' }
					}
				},
				post: {
					tags: ['Petition Signatures'],
					summary: 'Create petition signature',
					parameters: params.petitionId,
					requestBody: {
						required: true,
						content: {
							'application/json': {
								schema: { $ref: '#/components/schemas/CreatePetitionSignatureRequest' }
							}
						}
					},
					responses: {
						'200': {
							description: 'Created petition signature',
							content: {
								'application/json': {
									schema: { $ref: '#/components/schemas/PetitionSignature' }
								}
							}
						},
						'400': { $ref: '#/components/responses/BadRequest' },
						'401': { $ref: '#/components/responses/Unauthorized' },
						'500': { $ref: '#/components/responses/InternalServerError' }
					}
				}
			},
			'/api/v1/petitions/{petitionId}/signatures/{signatureId}': {
				get: {
					tags: ['Petition Signatures'],
					summary: 'Get petition signature',
					parameters: params.petitionAndSignatureId,
					responses: {
						'200': {
							description: 'Petition signature',
							content: {
								'application/json': {
									schema: { $ref: '#/components/schemas/PetitionSignature' }
								}
							}
						},
						'401': { $ref: '#/components/responses/Unauthorized' },
						'500': { $ref: '#/components/responses/InternalServerError' }
					}
				},
				put: {
					tags: ['Petition Signatures'],
					summary: 'Update petition signature',
					parameters: params.petitionAndSignatureId,
					requestBody: {
						required: true,
						content: {
							'application/json': {
								schema: { $ref: '#/components/schemas/UpdatePetitionSignatureRequest' }
							}
						}
					},
					responses: {
						'200': {
							description: 'Updated petition signature',
							content: {
								'application/json': {
									schema: { $ref: '#/components/schemas/PetitionSignature' }
								}
							}
						},
						'400': { $ref: '#/components/responses/BadRequest' },
						'401': { $ref: '#/components/responses/Unauthorized' },
						'500': { $ref: '#/components/responses/InternalServerError' }
					}
				},
				delete: {
					tags: ['Petition Signatures'],
					summary: 'Delete petition signature',
					parameters: params.petitionAndSignatureId,
					responses: {
						'204': { description: 'Petition signature deleted' },
						'401': { $ref: '#/components/responses/Unauthorized' },
						'500': { $ref: '#/components/responses/InternalServerError' }
					}
				}
			}
		},
		schemas: {
			Petition: petitionOpenApiSchema,
			CreatePetitionRequest: createPetitionRequestSchema,
			UpdatePetitionRequest: updatePetitionRequestSchema,
			PetitionListResponse: buildListEnvelopeSchema('#/components/schemas/Petition'),
			PetitionSignature: petitionSignatureOpenApiSchema,
			CreatePetitionSignatureRequest: createPetitionSignatureRequestSchema,
			UpdatePetitionSignatureRequest: updatePetitionSignatureRequestSchema,
			PetitionSignatureListResponse: buildListEnvelopeSchema(
				'#/components/schemas/PetitionSignature'
			)
		}
	};
}
