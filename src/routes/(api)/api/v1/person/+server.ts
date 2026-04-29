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
	listPersons,
	createPerson,
	_countPersons,
	_getPersonByIdUnsafe
} from '$lib/server/api/data/person/person';
import { parse, array } from 'valibot';
import { personApiSchema, createPersonRest as createPersonRestSchema } from '$lib/schema/person';
import { v7 as uuidv7 } from 'uuid';

export async function GET(event) {
	const { organizationId, ctx } = safeApiRouteQueryContext(event.locals.authorizedApiOrganization);
	const input = buildApiListFilter({ organizationId, url: event.url });
	const result = await db.transaction(async (tx) => {
		const persons = await listPersons({ ctx, input, tx });
		const count = await _countPersons({ organizationId, searchString: input.searchString, tx });
		return { persons, count };
	});

	return json(
		buildApiListResponse({
			data: processOutgoingBody(result.persons, array(personApiSchema)),
			count: result.count
		})
	);
}

export async function POST(event) {
	const { organizationId, ctx } = safeApiRouteQueryContext(event.locals.authorizedApiOrganization);
	const input = await processIncomingBody(event, createPersonRestSchema);
	const result = await db.transaction(async (tx) => {
		const person = await createPerson({
			ctx,
			args: {
				metadata: { organizationId, personId: uuidv7(), addedFrom: { type: 'rest_api' } },
				input: {
					...input,
					dateOfBirth: input.dateOfBirth ? input.dateOfBirth.getTime() : null
				}
			},
			tx
		});
		return person;
	});
	return json(processOutgoingBody(result, personApiSchema));
}
