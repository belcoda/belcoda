import { json, error } from '@sveltejs/kit';
import {
	safeApiRouteQueryContext,
	processIncomingBody,
	processOutgoingBody
} from '$lib/server/utils/restApi';
import { db } from '$lib/server/db';
import { getTag, updateTag, deleteTag } from '$lib/server/api/data/tag/tag';
import { tagApiSchema, updateTag as updateTagRestBody } from '$lib/schema/tag';

import pino from '$lib/pino';
const log = pino(import.meta.url);

export async function GET(event) {
	const { ctx } = safeApiRouteQueryContext(event.locals.authorizedApiOrganization);
	const tagId = event.params.tagId!;
	const record = await db.transaction(async (tx) => {
		const record = await getTag({ ctx, tx, args: { tagId } }).catch((err) => {
			log.error(err, 'Error getting tag for API');
			throw error(404, { message: 'Tag not found' });
		});
		return record;
	});
	return json(processOutgoingBody(record, tagApiSchema));
}

export async function PUT(event) {
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

export async function DELETE(event) {
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
