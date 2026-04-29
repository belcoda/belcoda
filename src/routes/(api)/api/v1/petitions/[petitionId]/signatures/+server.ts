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
	listPetitionSignaturesForOrg,
	countPetitionSignaturesForOrg,
	createPetitionSignature
} from '$lib/server/api/data/petition/signature';
import { array } from 'valibot';
import {
	petitionSignatureApiSchema,
	createPetitionSignatureApiBody
} from '$lib/schema/petition/petition-signature';
import { v7 as uuidv7 } from 'uuid';

function buildPetitionSignaturesListInput(organizationId: string, petitionId: string, url: URL) {
	const base = buildApiListFilter({ organizationId, url });
	const teamId = url.searchParams.get('teamId');
	const personParam = url.searchParams.get('personId');

	return {
		...base,
		petitionId,
		teamId: teamId ?? null,
		...(personParam ? { personId: personParam } : {})
	};
}

export async function GET(event: import('@sveltejs/kit').RequestEvent) {
	const { organizationId, ctx } = safeApiRouteQueryContext(event.locals.authorizedApiOrganization);
	const petitionId = event.params.petitionId!;
	const input = buildPetitionSignaturesListInput(organizationId, petitionId, event.url);

	const result = await db.transaction(async (tx) => {
		const junctionRows = await listPetitionSignaturesForOrg({ ctx, input, tx });
		const count = await countPetitionSignaturesForOrg({ tx, input });
		return { junctionRows, count };
	});

	const withoutPersonRows = result.junctionRows.map((row: { person?: unknown }) => {
		const { person: _omit, ...sig } = row as Record<string, unknown> & { person?: unknown };
		return sig;
	});

	return json(
		buildApiListResponse({
			data: processOutgoingBody(withoutPersonRows, array(petitionSignatureApiSchema)),
			count: result.count
		})
	);
}

export async function POST(event: import('@sveltejs/kit').RequestEvent) {
	const { organizationId, ctx } = safeApiRouteQueryContext(event.locals.authorizedApiOrganization);
	const petitionId = event.params.petitionId!;
	const body = await processIncomingBody(event, createPetitionSignatureApiBody);
	const created = await db.transaction(async (tx) => {
		return await createPetitionSignature({
			ctx,
			tx,
			args: {
				metadata: {
					organizationId,
					petitionId,
					personId: body.personId,
					petitionSignatureId: uuidv7()
				},
				input: {
					petitionId,
					personId: body.personId,
					details: body.details,
					responses: body.responses ?? null
				}
			}
		});
	});
	const { organizationId: _org, ...data } = created;
	return json(processOutgoingBody(data, petitionSignatureApiSchema));
}
