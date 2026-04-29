import { json } from '@sveltejs/kit';
import {
	buildApiListFilter,
	buildApiListResponse,
	safeApiRouteQueryContext,
	processIncomingBody,
	processOutgoingBody
} from '$lib/server/utils/restApi';
import { db } from '$lib/server/db';
import { listTags, countTags, createTag } from '$lib/server/api/data/tag/tag';
import { array } from 'valibot';
import { tagApiSchema, createTag as createTagRestBody } from '$lib/schema/tag';
import { v7 as uuidv7 } from 'uuid';

export async function GET(event: import('@sveltejs/kit').RequestEvent) {
	const { organizationId, ctx } = safeApiRouteQueryContext(event.locals.authorizedApiOrganization);
	const input = buildApiListFilter({ organizationId, url: event.url });
	const includeInactive = event.url.searchParams.get('includeInactive') === 'true';
	const listInput = {
		...input,
		personId: null,
		...(includeInactive ? { includeInactive: true as const } : {})
	};
	const result = await db.transaction(async (tx) => {
		const tags = await listTags({ ctx, input: listInput, tx });
		const count = await countTags({ tx, input, includeInactive });
		return { tags, count };
	});

	return json(
		buildApiListResponse({
			data: processOutgoingBody(result.tags, array(tagApiSchema)),
			count: result.count
		})
	);
}

export async function POST(event: import('@sveltejs/kit').RequestEvent) {
	const { organizationId, ctx } = safeApiRouteQueryContext(event.locals.authorizedApiOrganization);
	const body = await processIncomingBody(event, createTagRestBody);
	const created = await db.transaction(async (tx) => {
		return await createTag({
			ctx,
			args: {
				input: body,
				metadata: { organizationId, tagId: uuidv7() }
			},
			tx
		});
	});
	return json(processOutgoingBody(created, tagApiSchema));
}
