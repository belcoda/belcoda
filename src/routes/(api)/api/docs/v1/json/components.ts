import { queryParamsOpenAPIDefinition } from '$lib/server/utils/restApi';

export function buildSharedComponents() {
	return {
		securitySchemes: {
			ApiKeyAuth: {
				type: 'apiKey',
				in: 'header',
				name: 'x-api-key',
				description: 'Organization scoped API key.'
			}
		},
		parameters: {
			PersonId: {
				name: 'personId',
				in: 'path',
				required: true,
				schema: { type: 'string', format: 'uuid' },
				description: 'Person ID'
			},
			NoteId: {
				name: 'noteId',
				in: 'path',
				required: true,
				schema: { type: 'string', format: 'uuid' },
				description: 'Person note ID'
			},
			TagId: {
				name: 'tagId',
				in: 'path',
				required: true,
				schema: { type: 'string', format: 'uuid' },
				description: 'Tag ID'
			},
			TeamId: {
				name: 'teamId',
				in: 'path',
				required: true,
				schema: { type: 'string', format: 'uuid' },
				description: 'Team ID'
			},
			EventId: {
				name: 'eventId',
				in: 'path',
				required: true,
				schema: { type: 'string', format: 'uuid' },
				description: 'Event ID'
			},
			EventSignupId: {
				name: 'eventSignupId',
				in: 'path',
				required: true,
				schema: { type: 'string', format: 'uuid' },
				description: 'Event signup ID'
			},
			PetitionId: {
				name: 'petitionId',
				in: 'path',
				required: true,
				schema: { type: 'string', format: 'uuid' },
				description: 'Petition ID'
			},
			SignatureId: {
				name: 'signatureId',
				in: 'path',
				required: true,
				schema: { type: 'string', format: 'uuid' },
				description: 'Petition signature ID'
			},
			PageSize: queryParamsOpenAPIDefinition.pageSize,
			Search: queryParamsOpenAPIDefinition.searchString,
			StartAfter: queryParamsOpenAPIDefinition.startAfter
		},
		responses: {
			BadRequest: {
				description: 'Bad request',
				content: {
					'application/json': {
						schema: { $ref: '#/components/schemas/ErrorResponse' }
					}
				}
			},
			Unauthorized: {
				description: 'Unauthorized',
				content: {
					'application/json': {
						schema: { $ref: '#/components/schemas/ErrorResponse' }
					}
				}
			},
			InternalServerError: {
				description: 'Internal server error',
				content: {
					'application/json': {
						schema: { $ref: '#/components/schemas/ErrorResponse' }
					}
				}
			}
		},
		schemas: {
			ErrorResponse: {
				type: 'object',
				required: ['error'],
				properties: {
					error: {
						type: 'string'
					}
				},
				additionalProperties: false
			}
		}
	};
}
