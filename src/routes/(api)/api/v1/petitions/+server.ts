import { json } from '@sveltejs/kit';
import {
	buildApiListFilter,
	buildApiListResponse,
	safeApiRouteQueryContext,
	processIncomingBody,
	processOutgoingBody
} from '$lib/server/utils/restApi';
import { db } from '$lib/server/db';
import {
	listPetitionsForOrg,
	countPetitionsForOrg,
	createPetition as persistCreatePetition
} from '$lib/server/api/data/petition/petition';
import { array } from 'valibot';
import { petitionApiSchema, createPetition } from '$lib/schema/petition/petition';
import { v7 as uuidv7 } from 'uuid';

function buildPetitionsListInput(organizationId: string, url: URL) {
	const base = buildApiListFilter({ organizationId, url });
	const teamId = url.searchParams.get('teamId');
	const status = url.searchParams.get('status');

	return {
		...base,
		teamId: teamId ?? null,
		status:
			status === 'draft' || status === 'published' || status === 'archived'
				? (status as 'draft' | 'published' | 'archived')
				: null
	};
}

export async function GET(event: import('@sveltejs/kit').RequestEvent) {
	const { organizationId, ctx } = safeApiRouteQueryContext(event.locals.authorizedApiOrganization);
	const input = buildPetitionsListInput(organizationId, event.url);

	const result = await db.transaction(async (tx) => {
		const petitions = await listPetitionsForOrg({ ctx, input, tx });
		const count = await countPetitionsForOrg({ tx, input });
		return { petitions, count };
	});

	return json(
		buildApiListResponse({
			data: processOutgoingBody(result.petitions, array(petitionApiSchema)),
			count: result.count
		})
	);
}

export async function POST(event: import('@sveltejs/kit').RequestEvent) {
	const { organizationId, ctx } = safeApiRouteQueryContext(event.locals.authorizedApiOrganization);
	const body = await processIncomingBody(event, createPetition);
	const created = await db.transaction(async (tx) => {
		return await persistCreatePetition({
			ctx,
			tx,
			args: {
				metadata: { organizationId, petitionId: uuidv7() },
				input: body
			}
		});
	});
	const { organizationId: _orgId, ...data } = created;
	return json(processOutgoingBody(data, petitionApiSchema));
}
