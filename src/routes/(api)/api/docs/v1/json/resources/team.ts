import { createTeam, teamApiSchema, updateTeam } from '$lib/schema/team';
import { buildListEnvelopeSchema, generateOpenSchemaFromValibot } from '../utils';
import { params } from '../params';

export async function buildTeamResourceSpec() {
	const [teamOpenApiSchema, createTeamRequestSchema, updateTeamRequestSchema] = await Promise.all([
		generateOpenSchemaFromValibot(teamApiSchema),
		generateOpenSchemaFromValibot(createTeam),
		generateOpenSchemaFromValibot(updateTeam)
	]);

	return {
		tags: [{ name: 'Team' }],
		paths: {
			'/api/v1/teams': {
				get: {
					tags: ['Team'],
					summary: 'List teams',
					parameters: params.list,
					responses: {
						'200': {
							description: 'List of teams',
							content: {
								'application/json': {
									schema: { $ref: '#/components/schemas/TeamListResponse' }
								}
							}
						},
						'400': { $ref: '#/components/responses/BadRequest' },
						'401': { $ref: '#/components/responses/Unauthorized' },
						'500': { $ref: '#/components/responses/InternalServerError' }
					}
				},
				post: {
					tags: ['Team'],
					summary: 'Create team',
					requestBody: {
						required: true,
						content: {
							'application/json': {
								schema: { $ref: '#/components/schemas/CreateTeamRequest' }
							}
						}
					},
					responses: {
						'200': {
							description: 'Created team',
							content: { 'application/json': { schema: { $ref: '#/components/schemas/Team' } } }
						},
						'400': { $ref: '#/components/responses/BadRequest' },
						'401': { $ref: '#/components/responses/Unauthorized' },
						'500': { $ref: '#/components/responses/InternalServerError' }
					}
				}
			},
			'/api/v1/teams/{teamId}': {
				get: {
					tags: ['Team'],
					summary: 'Get team',
					parameters: params.teamId,
					responses: {
						'200': {
							description: 'Team',
							content: { 'application/json': { schema: { $ref: '#/components/schemas/Team' } } }
						},
						'401': { $ref: '#/components/responses/Unauthorized' },
						'500': { $ref: '#/components/responses/InternalServerError' }
					}
				},
				put: {
					tags: ['Team'],
					summary: 'Update team',
					parameters: params.teamId,
					requestBody: {
						required: true,
						content: {
							'application/json': {
								schema: { $ref: '#/components/schemas/UpdateTeamRequest' }
							}
						}
					},
					responses: {
						'200': {
							description: 'Updated team',
							content: { 'application/json': { schema: { $ref: '#/components/schemas/Team' } } }
						},
						'400': { $ref: '#/components/responses/BadRequest' },
						'401': { $ref: '#/components/responses/Unauthorized' },
						'500': { $ref: '#/components/responses/InternalServerError' }
					}
				},
				delete: {
					tags: ['Team'],
					summary: 'Delete team',
					parameters: params.teamId,
					responses: {
						'204': { description: 'Team deleted' },
						'401': { $ref: '#/components/responses/Unauthorized' },
						'500': { $ref: '#/components/responses/InternalServerError' }
					}
				}
			}
		},
		schemas: {
			Team: teamOpenApiSchema,
			CreateTeamRequest: createTeamRequestSchema,
			UpdateTeamRequest: updateTeamRequestSchema,
			TeamListResponse: buildListEnvelopeSchema('#/components/schemas/Team')
		}
	};
}
