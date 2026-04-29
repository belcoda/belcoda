import { json } from '@sveltejs/kit';
import { safeApiRouteQueryContext } from '$lib/server/utils/restApi';
import { db } from '$lib/server/db';
import { removePersonTag } from '$lib/server/api/data/person/tag';

export async function DELETE(event: import('@sveltejs/kit').RequestEvent) {
	const { organizationId, ctx } = safeApiRouteQueryContext(event.locals.authorizedApiOrganization);
	const personId = event.params.personId!;
	const tagId = event.params.tagId!;
	await db.transaction(async (tx) => {
		await removePersonTag({
			ctx,
			args: {
				metadata: {
					tagId,
					personId,
					organizationId
				}
			},
			tx
		});
	});
	return new Response(null, { status: 204 });
}
