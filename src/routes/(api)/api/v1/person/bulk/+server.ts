import { json, error } from '@sveltejs/kit';
import { safeApiRouteQueryContext, processIncomingBody } from '$lib/server/utils/restApi';
import { bulkUpsertPersonRestSchema } from '$lib/schema/person';
import { getQueue } from '$lib/server/queue/index.js';

export async function PUT(event) {
	const { organizationId, ctx } = safeApiRouteQueryContext(event.locals.authorizedApiOrganization);
	const input = await processIncomingBody(event, bulkUpsertPersonRestSchema);
	const queue = await getQueue();
	await queue.apiBulkUpsert({ organizationId, csvUrl: input.csvUrl });
	return json({ queued: true }, { status: 202 });
}
