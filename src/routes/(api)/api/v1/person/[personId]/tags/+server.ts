import { json } from '@sveltejs/kit';
import {
	buildApiListFilter,
	buildApiListResponse,
	safeApiRouteQueryContext,
	processIncomingBody,
	processOutgoingBody
} from '$lib/server/utils/restApi';
import { db } from '$lib/server/db';
import { listPersonTags, countPersonTags, addPersonTag } from '$lib/server/api/data/person/tag';
import { array } from 'valibot';
import { addPersonTagApiBody, tagApiSchema } from '$lib/schema/tag';
import { tag } from '$lib/schema/drizzle';
import { eq } from 'drizzle-orm';

export async function GET(event: import('@sveltejs/kit').RequestEvent) {
	const { organizationId, ctx } = safeApiRouteQueryContext(event.locals.authorizedApiOrganization);
	const input = buildApiListFilter({ organizationId, url: event.url });
	const personId = event.params.personId!;
	const result = await db.transaction(async (tx) => {
		const junctionRows = await listPersonTags({ ctx, input, tx, personId });
		const count = await countPersonTags({
			tx,
			input,
			personId
		});
		return { junctionRows, count };
	});

	const tags = result.junctionRows
		.map((row) => row.tag)
		.filter((t): t is NonNullable<typeof t> => t != null);
	const output = processOutgoingBody(tags, array(tagApiSchema));
	return json(buildApiListResponse({ data: output, count: result.count }));
}

export async function POST(event: import('@sveltejs/kit').RequestEvent) {
	const { organizationId, ctx } = safeApiRouteQueryContext(event.locals.authorizedApiOrganization);
	const body = await processIncomingBody(event, addPersonTagApiBody);
	const personId = event.params.personId!;

	const tagRow = await db.transaction(async (tx) => {
		await addPersonTag({
			ctx,
			args: {
				metadata: { personId, organizationId, tagId: body.tagId }
			},
			tx
		});
		const row = await tx.dbTransaction.wrappedTransaction.query.tag.findFirst({
			where: eq(tag.id, body.tagId)
		});
		return row;
	});
	if (!tagRow) {
		throw new Error('Tag not found after link');
	}
	return json(processOutgoingBody(tagRow, tagApiSchema));
}
