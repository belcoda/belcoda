import { addPersonTeamApiBody, teamApiSchema } from '$lib/schema/team';
import { buildListEnvelopeSchema, generateOpenSchemaFromValibot } from '../utils';
import { params } from '../params';

export async function buildPersonTeamResourceSpec() {
	const [teamOpenApiSchema, addPersonTeamRequestOpenApiSchema] = await Promise.all([
		generateOpenSchemaFromValibot(teamApiSchema),
		generateOpenSchemaFromValibot(addPersonTeamApiBody)
	]);

	return {
		tags: [{ name: 'Person Teams' }],
		paths: {
			'/api/v1/person/{personId}/teams': {
				get: {
					tags: ['Person Teams'],
					summary: 'List person teams',
					parameters: [...params.personId, ...params.list],
					responses: {
						'200': {
							description: 'List of person teams',
							content: {
								'application/json': {
									schema: { $ref: '#/components/schemas/PersonTeamListResponse' }
								}
							}
						},
						'400': { $ref: '#/components/responses/BadRequest' },
						'401': { $ref: '#/components/responses/Unauthorized' },
						'500': { $ref: '#/components/responses/InternalServerError' }
					}
				},
				post: {
					tags: ['Person Teams'],
					summary: 'Add person to team',
					parameters: params.personId,
					requestBody: {
						required: true,
						content: {
							'application/json': {
								schema: { $ref: '#/components/schemas/AddPersonTeamRequest' }
							}
						}
					},
					responses: {
						'200': {
							description: 'Person added to team',
							content: {
								'application/json': {
									schema: { $ref: '#/components/schemas/Team' }
								}
							}
						},
						'204': {
							description: 'Person was already a member of this team'
						},
						'400': { $ref: '#/components/responses/BadRequest' },
						'401': { $ref: '#/components/responses/Unauthorized' },
						'500': { $ref: '#/components/responses/InternalServerError' }
					}
				}
			},
			'/api/v1/person/{personId}/teams/{teamId}': {
				delete: {
					tags: ['Person Teams'],
					summary: 'Remove person from team',
					parameters: params.personAndTeamId,
					responses: {
						'204': { description: 'Person removed from team' },
						'401': { $ref: '#/components/responses/Unauthorized' },
						'500': { $ref: '#/components/responses/InternalServerError' }
					}
				}
			}
		},
		schemas: {
			Team: teamOpenApiSchema,
			AddPersonTeamRequest: addPersonTeamRequestOpenApiSchema,
			PersonTeamListResponse: buildListEnvelopeSchema('#/components/schemas/Team')
		}
	};
}
