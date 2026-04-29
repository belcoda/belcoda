import { json } from '@sveltejs/kit';
import {
	safeApiRouteQueryContext,
	processIncomingBody,
	processOutgoingBody
} from '$lib/server/utils/restApi';
import { db } from '$lib/server/db';
import { getTeam, updateTeam } from '$lib/server/api/data/team/team';
import { teamApiSchema, updateTeam as updateTeamRestBody } from '$lib/schema/team';

export async function GET(event: import('@sveltejs/kit').RequestEvent) {
	const { ctx } = safeApiRouteQueryContext(event.locals.authorizedApiOrganization);
	const teamId = event.params.teamId!;
	const record = await db.transaction(async (tx) => {
		return await getTeam({ ctx, tx, args: { teamId } });
	});
	return json(processOutgoingBody(record, teamApiSchema));
}

export async function PUT(event: import('@sveltejs/kit').RequestEvent) {
	const { organizationId, ctx } = safeApiRouteQueryContext(event.locals.authorizedApiOrganization);
	const teamId = event.params.teamId!;
	const input = await processIncomingBody(event, updateTeamRestBody);
	const updated = await db.transaction(async (tx) => {
		return await updateTeam({
			ctx,
			args: {
				metadata: { organizationId, teamId },
				input
			},
			tx
		});
	});
	return json(processOutgoingBody(updated, teamApiSchema));
}

export async function DELETE(event: import('@sveltejs/kit').RequestEvent) {
	const { organizationId, ctx } = safeApiRouteQueryContext(event.locals.authorizedApiOrganization);
	const teamId = event.params.teamId!;
	await db.transaction(async (tx) => {
		await updateTeam({
			ctx,
			args: {
				metadata: { organizationId, teamId },
				input: { deletedAt: Date.now() }
			},
			tx
		});
	});
	return new Response(null, { status: 204 });
}
