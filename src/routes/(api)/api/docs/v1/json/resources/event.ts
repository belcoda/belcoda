import { createEventRest, eventApiSchema, updateEventRest } from '$lib/schema/event';
import {
	createEventSignupApiBody,
	eventSignupApiSchema,
	updateEventSignup
} from '$lib/schema/event-signup';
import { buildListEnvelopeSchema, generateOpenSchemaFromValibot } from '../utils';
import { params } from '../params';

export async function buildEventResourceSpec() {
	const [
		eventOpenApiSchema,
		createEventRequestSchema,
		updateEventRequestSchema,
		eventSignupOpenApiSchema,
		createEventSignupRequestSchema,
		updateEventSignupRequestSchema
	] = await Promise.all([
		generateOpenSchemaFromValibot(eventApiSchema),
		generateOpenSchemaFromValibot(createEventRest),
		generateOpenSchemaFromValibot(updateEventRest),
		generateOpenSchemaFromValibot(eventSignupApiSchema),
		generateOpenSchemaFromValibot(createEventSignupApiBody),
		generateOpenSchemaFromValibot(updateEventSignup)
	]);

	return {
		tags: [{ name: 'Event' }, { name: 'Event Signups' }],
		paths: {
			'/api/v1/events': {
				get: {
					tags: ['Events'],
					summary: 'List events',
					parameters: [
						...params.list,
						{
							name: 'tagId',
							in: 'query',
							required: false,
							schema: { type: 'string', format: 'uuid' }
						},
						{
							name: 'teamId',
							in: 'query',
							required: false,
							schema: { type: 'string', format: 'uuid' }
						},
						{
							name: 'eventType',
							in: 'query',
							required: false,
							schema: { type: 'string', enum: ['online', 'in-person'] }
						},
						{
							name: 'status',
							in: 'query',
							required: false,
							schema: { type: 'string', enum: ['draft', 'published', 'cancelled'] }
						},
						{
							name: 'hasSignups',
							in: 'query',
							required: false,
							schema: { type: 'boolean' }
						},
						{
							name: 'isArchived',
							in: 'query',
							required: false,
							schema: { type: 'boolean' }
						},
						{
							name: 'dateRangeStart',
							in: 'query',
							required: false,
							schema: { type: 'number' }
						},
						{
							name: 'dateRangeEnd',
							in: 'query',
							required: false,
							schema: { type: 'number' }
						}
					],
					responses: {
						'200': {
							description: 'List of events',
							content: {
								'application/json': {
									schema: { $ref: '#/components/schemas/EventListResponse' }
								}
							}
						},
						'400': { $ref: '#/components/responses/BadRequest' },
						'401': { $ref: '#/components/responses/Unauthorized' },
						'500': { $ref: '#/components/responses/InternalServerError' }
					}
				},
				post: {
					tags: ['Events'],
					summary: 'Create event',
					requestBody: {
						required: true,
						content: {
							'application/json': {
								schema: { $ref: '#/components/schemas/CreateEventRequest' }
							}
						}
					},
					responses: {
						'200': {
							description: 'Created event',
							content: {
								'application/json': {
									schema: { $ref: '#/components/schemas/Event' }
								}
							}
						},
						'400': { $ref: '#/components/responses/BadRequest' },
						'401': { $ref: '#/components/responses/Unauthorized' },
						'500': { $ref: '#/components/responses/InternalServerError' }
					}
				}
			},
			'/api/v1/events/{eventId}': {
				get: {
					tags: ['Events'],
					summary: 'Get event',
					parameters: params.eventId,
					responses: {
						'200': {
							description: 'Event',
							content: { 'application/json': { schema: { $ref: '#/components/schemas/Event' } } }
						},
						'401': { $ref: '#/components/responses/Unauthorized' },
						'500': { $ref: '#/components/responses/InternalServerError' }
					}
				},
				put: {
					tags: ['Events'],
					summary: 'Update event',
					parameters: params.eventId,
					requestBody: {
						required: true,
						content: {
							'application/json': {
								schema: { $ref: '#/components/schemas/UpdateEventRequest' }
							}
						}
					},
					responses: {
						'200': {
							description: 'Updated event',
							content: { 'application/json': { schema: { $ref: '#/components/schemas/Event' } } }
						},
						'400': { $ref: '#/components/responses/BadRequest' },
						'401': { $ref: '#/components/responses/Unauthorized' },
						'500': { $ref: '#/components/responses/InternalServerError' }
					}
				},
				delete: {
					tags: ['Events'],
					summary: 'Delete event',
					parameters: params.eventId,
					responses: {
						'204': { description: 'Event deleted' },
						'401': { $ref: '#/components/responses/Unauthorized' },
						'500': { $ref: '#/components/responses/InternalServerError' }
					}
				}
			},
			'/api/v1/events/{eventId}/signups': {
				get: {
					tags: ['Event Signups'],
					summary: 'List event signups',
					parameters: [
						...params.eventId,
						...params.list,
						{
							name: 'tagId',
							in: 'query',
							required: false,
							schema: { type: 'string', format: 'uuid' }
						},
						{
							name: 'teamId',
							in: 'query',
							required: false,
							schema: { type: 'string', format: 'uuid' }
						},
						{
							name: 'signupStatus',
							in: 'query',
							required: false,
							schema: {
								type: 'string',
								enum: [
									'incomplete',
									'signup',
									'attended',
									'noshow',
									'notattending',
									'cancelled',
									'deleted'
								]
							}
						},
						{ name: 'includeDeleted', in: 'query', required: false, schema: { type: 'boolean' } },
						{ name: 'includeIncomplete', in: 'query', required: false, schema: { type: 'boolean' } }
					],
					responses: {
						'200': {
							description: 'List of event signups',
							content: {
								'application/json': {
									schema: { $ref: '#/components/schemas/EventSignupListResponse' }
								}
							}
						},
						'400': { $ref: '#/components/responses/BadRequest' },
						'401': { $ref: '#/components/responses/Unauthorized' },
						'500': { $ref: '#/components/responses/InternalServerError' }
					}
				},
				post: {
					tags: ['Event Signups'],
					summary: 'Create event signup',
					parameters: params.eventId,
					requestBody: {
						required: true,
						content: {
							'application/json': {
								schema: { $ref: '#/components/schemas/CreateEventSignupRequest' }
							}
						}
					},
					responses: {
						'200': {
							description: 'Created event signup',
							content: {
								'application/json': {
									schema: { $ref: '#/components/schemas/EventSignup' }
								}
							}
						},
						'400': { $ref: '#/components/responses/BadRequest' },
						'401': { $ref: '#/components/responses/Unauthorized' },
						'500': { $ref: '#/components/responses/InternalServerError' }
					}
				}
			},
			'/api/v1/events/{eventId}/signups/{eventSignupId}': {
				get: {
					tags: ['Event Signups'],
					summary: 'Get event signup',
					parameters: params.eventAndSignupId,
					responses: {
						'200': {
							description: 'Event signup',
							content: {
								'application/json': {
									schema: { $ref: '#/components/schemas/EventSignup' }
								}
							}
						},
						'401': { $ref: '#/components/responses/Unauthorized' },
						'404': { $ref: '#/components/responses/BadRequest' },
						'500': { $ref: '#/components/responses/InternalServerError' }
					}
				},
				put: {
					tags: ['Event Signups'],
					summary: 'Update event signup',
					parameters: params.eventAndSignupId,
					requestBody: {
						required: true,
						content: {
							'application/json': {
								schema: { $ref: '#/components/schemas/UpdateEventSignupRequest' }
							}
						}
					},
					responses: {
						'200': {
							description: 'Updated event signup',
							content: {
								'application/json': {
									schema: { $ref: '#/components/schemas/EventSignup' }
								}
							}
						},
						'400': { $ref: '#/components/responses/BadRequest' },
						'401': { $ref: '#/components/responses/Unauthorized' },
						'500': { $ref: '#/components/responses/InternalServerError' }
					}
				},
				delete: {
					tags: ['Event Signups'],
					summary: 'Delete event signup',
					parameters: params.eventAndSignupId,
					responses: {
						'204': { description: 'Event signup deleted' },
						'401': { $ref: '#/components/responses/Unauthorized' },
						'500': { $ref: '#/components/responses/InternalServerError' }
					}
				}
			}
		},
		schemas: {
			Event: eventOpenApiSchema,
			CreateEventRequest: createEventRequestSchema,
			UpdateEventRequest: updateEventRequestSchema,
			EventListResponse: buildListEnvelopeSchema('#/components/schemas/Event'),
			EventSignup: eventSignupOpenApiSchema,
			CreateEventSignupRequest: createEventSignupRequestSchema,
			UpdateEventSignupRequest: updateEventSignupRequestSchema,
			EventSignupListResponse: buildListEnvelopeSchema('#/components/schemas/EventSignup')
		}
	};
}
