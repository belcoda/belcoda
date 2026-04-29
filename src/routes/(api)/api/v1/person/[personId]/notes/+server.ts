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
	countPersonNotes,
	createPersonNote
} from '$lib/server/api/data/person/note';
import { parse, array } from 'valibot';
import { createPersonNoteApi, personNoteApiSchema } from '$lib/schema/person-note';
import { v7 as uuidv7 } from 'uuid';
import pino from '$lib/pino';
const log = pino(import.meta.url);

export async function GET(event) {
	const { organizationId, ctx } = safeApiRouteQueryContext(event.locals.authorizedApiOrganization);
	const input = buildApiListFilter({ organizationId, url: event.url });
	const result = await db.transaction(async (tx) => {
		const notes = await listPersonNotes({ ctx, input, tx, personId: event.params.personId });
		const count = await countPersonNotes({
			ctx,
			input,
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
			ctx: { ...ctx, userId: input.userId },
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
