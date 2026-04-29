import { json } from '@sveltejs/kit';
import {
	safeApiRouteQueryContext,
	processIncomingBody,
	processOutgoingBody
} from '$lib/server/utils/restApi';
import { db } from '$lib/server/db';
import { getTag, updateTag, deleteTag } from '$lib/server/api/data/tag/tag';
import { tagApiSchema, updateTag as updateTagRestBody } from '$lib/schema/tag';

export async function GET(event: import('@sveltejs/kit').RequestEvent) {
	const { ctx } = safeApiRouteQueryContext(event.locals.authorizedApiOrganization);
	const tagId = event.params.tagId!;
	const record = await db.transaction(async (tx) => {
		return await getTag({ ctx, tx, args: { tagId } });
	});
	return json(processOutgoingBody(record, tagApiSchema));
}

export async function PUT(event: import('@sveltejs/kit').RequestEvent) {
	const { organizationId, ctx } = safeApiRouteQueryContext(event.locals.authorizedApiOrganization);
	const tagId = event.params.tagId!;
	const input = await processIncomingBody(event, updateTagRestBody);
	const updated = await db.transaction(async (tx) => {
		return await updateTag({
			ctx,
			args: {
				metadata: { organizationId, tagId },
				input
			},
			tx
		});
	});
	return json(processOutgoingBody(updated, tagApiSchema));
}

export async function DELETE(event: import('@sveltejs/kit').RequestEvent) {
	const { organizationId, ctx } = safeApiRouteQueryContext(event.locals.authorizedApiOrganization);
	const tagId = event.params.tagId!;
	await db.transaction(async (tx) => {
		await deleteTag({
			ctx,
			args: {
				metadata: { organizationId, tagId }
			},
			tx
		});
	});
	return new Response(null, { status: 204 });
}
