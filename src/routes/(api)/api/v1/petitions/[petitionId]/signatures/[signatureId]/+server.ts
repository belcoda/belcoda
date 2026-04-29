import { json, error } from '@sveltejs/kit';
import { parse } from 'valibot';
import { safeApiRouteQueryContext, processIncomingBody } from '$lib/server/utils/restApi';
import { db } from '$lib/server/db';
import {
	getPetitionSignatureForApi,
	updatePetitionSignature as persistUpdatePetitionSignature,
	deletePetitionSignature as persistDeletePetitionSignature
} from '$lib/server/api/data/petition/signature';
import {
	petitionSignatureApiSchema,
	updatePetitionSignatureRest
} from '$lib/schema/petition/petition-signature';

export async function GET(event: import('@sveltejs/kit').RequestEvent) {
	const { ctx } = safeApiRouteQueryContext(event.locals.authorizedApiOrganization);
	const petitionId = event.params.petitionId!;
	const petitionSignatureId = event.params.signatureId!;

	const row = await db.transaction(async (tx) => {
		return await getPetitionSignatureForApi({
			ctx,
			tx,
			args: { petitionSignatureId }
		});
	});
	if (row.petitionId !== petitionId) {
		throw error(404, { message: 'Petition signature not found' });
	}

	const { organizationId, ...rest } = row;
	return json(parse(petitionSignatureApiSchema, rest));
}

export async function PUT(event: import('@sveltejs/kit').RequestEvent) {
	const { organizationId, ctx } = safeApiRouteQueryContext(event.locals.authorizedApiOrganization);
	const petitionId = event.params.petitionId!;
	const petitionSignatureId = event.params.signatureId!;
	const inputBody = await processIncomingBody(event, updatePetitionSignatureRest);

	const updated = await db.transaction(async (tx) => {
		const existing = await getPetitionSignatureForApi({
			ctx,
			tx,
			args: { petitionSignatureId }
		});
		if (existing.petitionId !== petitionId) {
			throw error(404, { message: 'Petition signature not found' });
		}
		await persistUpdatePetitionSignature({
			ctx,
			tx,
			args: {
				metadata: {
					organizationId,
					petitionId: existing.petitionId,
					personId: existing.personId,
					petitionSignatureId
				},
				input: inputBody
			}
		});
		return await getPetitionSignatureForApi({
			ctx,
			tx,
			args: { petitionSignatureId }
		});
	});

	const { organizationId: _org, ...rest } = updated;
	return json(parse(petitionSignatureApiSchema, rest));
}

export async function DELETE(event: import('@sveltejs/kit').RequestEvent) {
	const { organizationId, ctx } = safeApiRouteQueryContext(event.locals.authorizedApiOrganization);
	const petitionId = event.params.petitionId!;
	const petitionSignatureId = event.params.signatureId!;

	await db.transaction(async (tx) => {
		const existing = await getPetitionSignatureForApi({
			ctx,
			tx,
			args: { petitionSignatureId }
		});
		if (existing.petitionId !== petitionId) {
			throw error(404, { message: 'Petition signature not found' });
		}
		await persistDeletePetitionSignature({
			ctx,
			tx,
			args: {
				metadata: {
					organizationId,
					petitionId: existing.petitionId,
					personId: existing.personId,
					petitionSignatureId
				}
			}
		});
	});

	return new Response(null, { status: 204 });
}
