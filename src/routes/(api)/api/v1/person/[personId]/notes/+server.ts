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
	listPersonNotes,
	createPersonNote,
	_countPersonNotesUnsafe
} from '$lib/server/api/data/person/note';
import { array } from 'valibot';
import { createPersonNoteApi, personNoteApiSchema } from '$lib/schema/person-note';
import { v7 as uuidv7 } from 'uuid';

export async function GET(event) {
	const { organizationId, ctx } = safeApiRouteQueryContext(event.locals.authorizedApiOrganization);
	const input = buildApiListFilter({ organizationId, url: event.url });
	const result = await db.transaction(async (tx) => {
		const notes = await listPersonNotes({ ctx, input, tx, personId: event.params.personId });
		const count = await _countPersonNotesUnsafe({
			input,
			organizationId,
			tx,
			personId: event.params.personId
		});
		return { notes, count };
	});

	const output = processOutgoingBody(result.notes, array(personNoteApiSchema));
	return json(buildApiListResponse({ data: output, count: result.count }));
}

export async function POST(event) {
	const { organizationId, ctx } = safeApiRouteQueryContext(event.locals.authorizedApiOrganization);
	const input = await processIncomingBody(event, createPersonNoteApi);
	const result = await db.transaction(async (tx) => {
		const note = await createPersonNote({
			ctx: { ...ctx, userId: input.userId }, //it is safe to use the user-provided userId here because we are using an API key and the API key is owned by an organizational owner
			args: {
				input: { note: input.note },
				metadata: {
					personId: event.params.personId,
					organizationId,
					personNoteId: uuidv7(),
					userId: input.userId
				}
			},
			tx
		});
		return note;
	});
	return json(processOutgoingBody(result, personNoteApiSchema));
}
