import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/public';
import { buildPersonResourceSpec } from './resources/person';
import { buildPersonTagResourceSpec } from './resources/person_tag';
import { buildPersonTeamResourceSpec } from './resources/person_team';
import { buildEventResourceSpec } from './resources/event';
import { buildPetitionResourceSpec } from './resources/petition';
import { buildTagResourceSpec } from './resources/tag';
import { buildTeamResourceSpec } from './resources/team';
import { buildSharedComponents } from './components';

let openApiSchemaObject: Record<string, unknown> | null = null;

async function buildOpenApiSchema() {
	if (openApiSchemaObject) {
		return openApiSchemaObject;
	}

	const [
		personResource,
		personTagResource,
		personTeamResource,
		eventResource,
		petitionResource,
		tagResource,
		teamResource
	] = await Promise.all([
		buildPersonResourceSpec(),
		buildPersonTagResourceSpec(),
		buildPersonTeamResourceSpec(),
		buildEventResourceSpec(),
		buildPetitionResourceSpec(),
		buildTagResourceSpec(),
		buildTeamResourceSpec()
	]);

	const host = env.PUBLIC_HOST?.replace(/\/$/, '');
	const servers = host ? [{ url: host }] : [];
	const sharedComponents = buildSharedComponents();

	openApiSchemaObject = {
		openapi: '3.1.0',
		info: {
			title: 'Belcoda REST API v1',
			version: '2026-04-29',
			description:
				'Reference documentation for Belcoda API key authenticated REST endpoints under /api/v1.'
		},
		servers,
		security: [{ ApiKeyAuth: [] }],
		tags: [
			...personResource.tags,
			...personTagResource.tags,
			...personTeamResource.tags,
			...eventResource.tags,
			...petitionResource.tags,
			...tagResource.tags,
			...teamResource.tags
		],
		paths: {
			...personResource.paths,
			...personTagResource.paths,
			...personTeamResource.paths,
			...eventResource.paths,
			...petitionResource.paths,
			...tagResource.paths,
			...teamResource.paths
		},
		components: {
			securitySchemes: sharedComponents.securitySchemes,
			parameters: sharedComponents.parameters,
			responses: sharedComponents.responses,
			schemas: {
				...sharedComponents.schemas,
				...personResource.schemas,
				...personTagResource.schemas,
				...personTeamResource.schemas,
				...eventResource.schemas,
				...petitionResource.schemas,
				...tagResource.schemas,
				...teamResource.schemas
			}
		}
	};

	return openApiSchemaObject;
}

export async function GET() {
	return json(await buildOpenApiSchema());
}
