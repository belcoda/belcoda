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
	listPersonTeams,
	countPersonTeams,
	addPersonToTeam
} from '$lib/server/api/data/person/team';
import { array } from 'valibot';
import { addPersonTeamApiBody, teamApiSchema } from '$lib/schema/team';
import { team } from '$lib/schema/drizzle';
import { eq } from 'drizzle-orm';

export async function GET(event: import('@sveltejs/kit').RequestEvent) {
	const { organizationId, ctx } = safeApiRouteQueryContext(event.locals.authorizedApiOrganization);
	const input = buildApiListFilter({ organizationId, url: event.url });
	const personId = event.params.personId!;
	const result = await db.transaction(async (tx) => {
		const junctionRows = await listPersonTeams({ ctx, input, tx, personId });
		const count = await countPersonTeams({
			tx,
			input,
			personId
		});
		return { junctionRows, count };
	});

	const teams = result.junctionRows
		.map((row) => row.team)
		.filter((t): t is NonNullable<typeof t> => t != null);
	const output = processOutgoingBody(teams, array(teamApiSchema));
	return json(buildApiListResponse({ data: output, count: result.count }));
}

export async function POST(event: import('@sveltejs/kit').RequestEvent) {
	const { organizationId, ctx } = safeApiRouteQueryContext(event.locals.authorizedApiOrganization);
	const body = await processIncomingBody(event, addPersonTeamApiBody);
	const personId = event.params.personId!;

	const outcome = await db.transaction(async (tx) => {
		const inserted = await addPersonToTeam({
			ctx,
			args: {
				metadata: { personId, organizationId, teamId: body.teamId }
			},
			tx
		});
		if (!inserted) {
			return { inserted: false as const, teamRow: null };
		}
		const teamRow = await tx.dbTransaction.wrappedTransaction.query.team.findFirst({
			where: eq(team.id, body.teamId)
		});
		return { inserted: true as const, teamRow };
	});

	if (!outcome.inserted) {
		return new Response(null, { status: 204 });
	}
	if (!outcome.teamRow) {
		throw new Error('Team not found after link');
	}
	return json(processOutgoingBody(outcome.teamRow, teamApiSchema));
}
