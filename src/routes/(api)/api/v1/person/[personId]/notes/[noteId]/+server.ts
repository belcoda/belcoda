import { json } from '@sveltejs/kit';
import {
	processIncomingBody,
	processOutgoingBody,
	safeApiRouteQueryContext
} from '$lib/server/utils/restApi';
import { db } from '$lib/server/db';
import {
	_updatePersonNoteNoPermissionsCheck,
	deletePersonNote
} from '$lib/server/api/data/person/note';
import { personNoteApiSchema, updatePersonNoteZero } from '$lib/schema/person-note';
import pino from '$lib/pino';
const log = pino(import.meta.url);

export async function PUT(event) {
	const { organizationId } = safeApiRouteQueryContext(event.locals.authorizedApiOrganization);
	const input = await processIncomingBody(event, updatePersonNoteZero);
	const result = await db.transaction(async (tx) => {
		const note = await _updatePersonNoteNoPermissionsCheck({
			noteId: event.params.noteId,
			organizationId,
			note: input.note,
			tx
		});
		return note;
	});
	return json(processOutgoingBody(result, personNoteApiSchema));
}

export async function DELETE(event) {
	const { organizationId, ctx } = safeApiRouteQueryContext(event.locals.authorizedApiOrganization);
	await db.transaction(async (tx) => {
		const note = await deletePersonNote({
			ctx,
			args: {
				metadata: {
					personNoteId: event.params.noteId,
					organizationId,
					personId: event.params.personId
				}
			},
			tx
		});
		return note;
	});
	return new Response(null, { status: 204 });
}
