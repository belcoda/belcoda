import { json } from '@sveltejs/kit';
import {
	safeApiRouteQueryContext,
	processIncomingBody,
	processOutgoingBody
} from '$lib/server/utils/restApi';
import { db } from '$lib/server/db';
import {
	loadPetitionForApi,
	updatePetition as persistUpdatePetition,
	deletePetition as persistDeletePetition
} from '$lib/server/api/data/petition/petition';
import { petitionApiSchema, updatePetition } from '$lib/schema/petition/petition';

export async function GET(event: import('@sveltejs/kit').RequestEvent) {
	const { ctx } = safeApiRouteQueryContext(event.locals.authorizedApiOrganization);
	const petitionId = event.params.petitionId!;
	const row = await db.transaction(async (tx) => await loadPetitionForApi({ ctx, tx, petitionId }));
	return json(processOutgoingBody(row, petitionApiSchema));
}

export async function PUT(event: import('@sveltejs/kit').RequestEvent) {
	const { organizationId, ctx } = safeApiRouteQueryContext(event.locals.authorizedApiOrganization);
	const petitionId = event.params.petitionId!;
	const body = await processIncomingBody(event, updatePetition);

	await db.transaction(async (tx) => {
		await persistUpdatePetition({
			ctx,
			tx,
			args: {
				metadata: { organizationId, petitionId },
				input: body
			}
		});
	});

	const refreshed = await db.transaction(async (tx) => loadPetitionForApi({ ctx, tx, petitionId }));
	return json(processOutgoingBody(refreshed, petitionApiSchema));
}

export async function DELETE(event: import('@sveltejs/kit').RequestEvent) {
	const { organizationId, ctx } = safeApiRouteQueryContext(event.locals.authorizedApiOrganization);
	const petitionId = event.params.petitionId!;
	await db.transaction(async (tx) => {
		await persistDeletePetition({
			ctx,
			tx,
			args: { metadata: { organizationId, petitionId } }
		});
	});
	return new Response(null, { status: 204 });
}
