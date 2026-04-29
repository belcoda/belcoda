import { json } from '@sveltejs/kit';
import { safeApiRouteQueryContext } from '$lib/server/utils/restApi';
import { db } from '$lib/server/db';
import { removePersonFromTeam } from '$lib/server/api/data/person/team';

export async function DELETE(event: import('@sveltejs/kit').RequestEvent) {
	const { organizationId, ctx } = safeApiRouteQueryContext(event.locals.authorizedApiOrganization);
	const personId = event.params.personId!;
	const teamId = event.params.teamId!;
	await db.transaction(async (tx) => {
		await removePersonFromTeam({
			ctx,
			args: {
				metadata: {
					personId,
					organizationId,
					teamId
				}
			},
			tx
		});
	});
	return new Response(null, { status: 204 });
}
