import { json } from '@sveltejs/kit';
import {
	buildApiListFilter,
	buildApiListResponse,
	safeApiRouteQueryContext,
	processIncomingBody,
	processOutgoingBody
} from '$lib/server/utils/restApi';
import { db } from '$lib/server/db';
import { listTeams, countTeams, createTeam } from '$lib/server/api/data/team/team';
import { array } from 'valibot';
import { teamApiSchema, createTeam as createTeamRestBody } from '$lib/schema/team';
import { v7 as uuidv7 } from 'uuid';

export async function GET(event: import('@sveltejs/kit').RequestEvent) {
	const { organizationId, ctx } = safeApiRouteQueryContext(event.locals.authorizedApiOrganization);
	const input = buildApiListFilter({ organizationId, url: event.url });
	const listInput = {
		...input,
		personId: null
	};
	const result = await db.transaction(async (tx) => {
		const teams = await listTeams({ ctx, input: listInput, tx });
		const count = await countTeams({ tx, input });
		return { teams, count };
	});

	return json(
		buildApiListResponse({
			data: processOutgoingBody(result.teams, array(teamApiSchema)),
			count: result.count
		})
	);
}

export async function POST(event: import('@sveltejs/kit').RequestEvent) {
	const { organizationId, ctx } = safeApiRouteQueryContext(event.locals.authorizedApiOrganization);
	const body = await processIncomingBody(event, createTeamRestBody);
	const created = await db.transaction(async (tx) => {
		return await createTeam({
			ctx,
			args: {
				input: body,
				metadata: { organizationId, teamId: uuidv7() }
			},
			tx
		});
	});
	return json(processOutgoingBody(created, teamApiSchema));
}
