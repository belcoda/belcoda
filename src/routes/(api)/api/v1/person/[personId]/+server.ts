import { json } from '@sveltejs/kit';
import {
	safeApiRouteQueryContext,
	processIncomingBody,
	processOutgoingBody
} from '$lib/server/utils/restApi';
import { db } from '$lib/server/db';
import { getPerson, updatePerson, deletePerson } from '$lib/server/api/data/person/person';
import { personApiSchema, updatePersonRest as updatePersonRestSchema } from '$lib/schema/person';
export async function GET(event) {
	const { organizationId, ctx } = safeApiRouteQueryContext(event.locals.authorizedApiOrganization);
	const personId = event.params.personId;
	const result = await db.transaction(
		async (tx) => await getPerson({ ctx, args: { organizationId, personId }, tx })
	);
	return json(processOutgoingBody(result, personApiSchema));
}

export async function PUT(event) {
	const { organizationId, ctx } = safeApiRouteQueryContext(event.locals.authorizedApiOrganization);
	const personId = event.params.personId;
	const input = await processIncomingBody(event, updatePersonRestSchema);
	const result = await db.transaction(async (tx) => {
		const person = await updatePerson({
			ctx,
			args: {
				metadata: { organizationId, personId },
				input: {
					...input,
					dateOfBirth: input.dateOfBirth ? input.dateOfBirth.getTime() : undefined
				}
			},
			tx
		});
		return person;
	});
	return json(processOutgoingBody(result, personApiSchema));
}

export async function DELETE(event) {
	const { organizationId, ctx } = safeApiRouteQueryContext(event.locals.authorizedApiOrganization);
	const personId = event.params.personId;
	const result = await db.transaction(async (tx) => {
		const person = await deletePerson({
			ctx,
			args: { metadata: { organizationId, personId } },
			tx
		});
		return person;
	});
	return new Response(null, { status: 204 });
}
