import { createPersonRest, personApiSchema, updatePersonRest } from '$lib/schema/person';
import {
	createPersonNoteApi,
	personNoteApiSchema,
	updatePersonNoteZero
} from '$lib/schema/person-note';
import { generateOpenSchemaFromValibot, buildListEnvelopeSchema } from '../utils';
import { params } from '../params';

export async function buildPersonResourceSpec() {
	const [
		personOpenApiSchema,
		createPersonRequestOpenApiSchema,
		updatePersonRequestOpenApiSchema,
		personNoteOpenApiSchema,
		createPersonNoteRequestOpenApiSchema,
		updatePersonNoteRequestOpenApiSchema
	] = await Promise.all([
		generateOpenSchemaFromValibot(personApiSchema),
		generateOpenSchemaFromValibot(createPersonRest),
		generateOpenSchemaFromValibot(updatePersonRest),
		generateOpenSchemaFromValibot(personNoteApiSchema),
		generateOpenSchemaFromValibot(createPersonNoteApi),
		generateOpenSchemaFromValibot(updatePersonNoteZero)
	]);

	return {
		tags: [{ name: 'Person' }, { name: 'Person Notes' }],
		paths: {
			'/api/v1/person': {
				get: {
					tags: ['Person'],
					summary: 'List people',
					parameters: params.list,
					responses: {
						'200': {
							description: 'List of people',
							content: {
								'application/json': {
									schema: { $ref: '#/components/schemas/PersonListResponse' }
								}
							}
						},
						'400': { $ref: '#/components/responses/BadRequest' },
						'401': { $ref: '#/components/responses/Unauthorized' },
						'500': { $ref: '#/components/responses/InternalServerError' }
					}
				},
				post: {
					tags: ['Person'],
					summary: 'Create person',
					requestBody: {
						required: true,
						content: {
							'application/json': {
								schema: { $ref: '#/components/schemas/CreatePersonRequest' }
							}
						}
					},
					responses: {
						'200': {
							description: 'Created person',
							content: {
								'application/json': {
									schema: { $ref: '#/components/schemas/Person' }
								}
							}
						},
						'400': { $ref: '#/components/responses/BadRequest' },
						'401': { $ref: '#/components/responses/Unauthorized' },
						'500': { $ref: '#/components/responses/InternalServerError' }
					}
				}
			},
			'/api/v1/person/{personId}': {
				get: {
					tags: ['Person'],
					summary: 'Get person',
					parameters: params.personId,
					responses: {
						'200': {
							description: 'Person',
							content: {
								'application/json': {
									schema: { $ref: '#/components/schemas/Person' }
								}
							}
						},
						'401': { $ref: '#/components/responses/Unauthorized' },
						'500': { $ref: '#/components/responses/InternalServerError' }
					}
				},
				put: {
					tags: ['Person'],
					summary: 'Update person',
					parameters: params.personId,
					requestBody: {
						required: true,
						content: {
							'application/json': {
								schema: { $ref: '#/components/schemas/UpdatePersonRequest' }
							}
						}
					},
					responses: {
						'200': {
							description: 'Updated person',
							content: {
								'application/json': {
									schema: { $ref: '#/components/schemas/Person' }
								}
							}
						},
						'400': { $ref: '#/components/responses/BadRequest' },
						'401': { $ref: '#/components/responses/Unauthorized' },
						'500': { $ref: '#/components/responses/InternalServerError' }
					}
				},
				delete: {
					tags: ['Person'],
					summary: 'Delete person',
					parameters: params.personId,
					responses: {
						'204': {
							description: 'Person deleted'
						},
						'401': { $ref: '#/components/responses/Unauthorized' },
						'500': { $ref: '#/components/responses/InternalServerError' }
					}
				}
			},
			'/api/v1/person/{personId}/notes': {
				get: {
					tags: ['Person Notes'],
					summary: 'List person notes',
					parameters: [...params.personId, ...params.list],
					responses: {
						'200': {
							description: 'List of person notes',
							content: {
								'application/json': {
									schema: { $ref: '#/components/schemas/PersonNoteListResponse' }
								}
							}
						},
						'400': { $ref: '#/components/responses/BadRequest' },
						'401': { $ref: '#/components/responses/Unauthorized' },
						'500': { $ref: '#/components/responses/InternalServerError' }
					}
				},
				post: {
					tags: ['Person Notes'],
					summary: 'Create person note',
					parameters: params.personId,
					requestBody: {
						required: true,
						content: {
							'application/json': {
								schema: { $ref: '#/components/schemas/CreatePersonNoteRequest' }
							}
						}
					},
					responses: {
						'200': {
							description: 'Created person note',
							content: {
								'application/json': {
									schema: { $ref: '#/components/schemas/PersonNote' }
								}
							}
						},
						'400': { $ref: '#/components/responses/BadRequest' },
						'401': { $ref: '#/components/responses/Unauthorized' },
						'500': { $ref: '#/components/responses/InternalServerError' }
					}
				}
			},
			'/api/v1/person/{personId}/notes/{noteId}': {
				put: {
					tags: ['Person Notes'],
					summary: 'Update person note',
					parameters: params.personAndNoteId,
					requestBody: {
						required: true,
						content: {
							'application/json': {
								schema: { $ref: '#/components/schemas/UpdatePersonNoteRequest' }
							}
						}
					},
					responses: {
						'200': {
							description: 'Updated person note',
							content: {
								'application/json': {
									schema: { $ref: '#/components/schemas/PersonNote' }
								}
							}
						},
						'400': { $ref: '#/components/responses/BadRequest' },
						'401': { $ref: '#/components/responses/Unauthorized' },
						'500': { $ref: '#/components/responses/InternalServerError' }
					}
				},
				delete: {
					tags: ['Person Notes'],
					summary: 'Delete person note',
					parameters: params.personAndNoteId,
					responses: {
						'204': {
							description: 'Person note deleted'
						},
						'401': { $ref: '#/components/responses/Unauthorized' },
						'500': { $ref: '#/components/responses/InternalServerError' }
					}
				}
			}
		},
		schemas: {
			Person: personOpenApiSchema,
			CreatePersonRequest: createPersonRequestOpenApiSchema,
			UpdatePersonRequest: updatePersonRequestOpenApiSchema,
			PersonNote: personNoteOpenApiSchema,
			CreatePersonNoteRequest: createPersonNoteRequestOpenApiSchema,
			UpdatePersonNoteRequest: updatePersonNoteRequestOpenApiSchema,
			PersonListResponse: buildListEnvelopeSchema('#/components/schemas/Person'),
			PersonNoteListResponse: buildListEnvelopeSchema('#/components/schemas/PersonNote')
		}
	};
}
