import { json, error } from '@sveltejs/kit';
import {
	safeApiRouteQueryContext,
	processIncomingBody,
	processOutgoingBody
} from '$lib/server/utils/restApi';
import { db } from '$lib/server/db';
import { loadEventForApi, updateEvent, deleteEvent } from '$lib/server/api/data/event/event';
import { eventApiSchema, updateEventRest } from '$lib/schema/event';
import pino from '$lib/pino';
const log = pino(import.meta.url);

export async function GET(event) {
	const { ctx } = safeApiRouteQueryContext(event.locals.authorizedApiOrganization);
	const eventId = event.params.eventId!;
	const row = await db
		.transaction(async (tx) => await loadEventForApi({ ctx, tx, eventId }))
		.catch((err) => {
			log.error(err, 'Error loading event for API');
			throw error(404, { message: 'Event not found' });
		});
	return json(processOutgoingBody(row, eventApiSchema));
}

export async function PUT(event) {
	const { organizationId, ctx } = safeApiRouteQueryContext(event.locals.authorizedApiOrganization);
	const eventId = event.params.eventId!;
	const body = await processIncomingBody(event, updateEventRest);
	const { startsAt, endsAt, ...rest } = body;
	const patch = {
		...rest,
		...(startsAt !== undefined ? { startsAt: startsAt.getTime() } : {}),
		...(endsAt !== undefined ? { endsAt: endsAt.getTime() } : {})
	};
	const refreshed = await db
		.transaction(async (tx) => {
			await updateEvent({
				ctx,
				tx,
				args: {
					metadata: { organizationId, eventId },
					input: patch
				}
			});
			return await loadEventForApi({ ctx, tx, eventId });
		})
		.catch((err) => {
			log.error(err, 'Error updating event for API');
			throw error(500, { message: 'Error updating event' });
		});
	return json(processOutgoingBody(refreshed, eventApiSchema));
}

export async function DELETE(event) {
	const { organizationId, ctx } = safeApiRouteQueryContext(event.locals.authorizedApiOrganization);
	const eventId = event.params.eventId!;
	await db.transaction(async (tx) => {
		await deleteEvent({
			ctx,
			tx,
			args: { metadata: { organizationId, eventId } }
		});
	});
	return new Response(null, { status: 204 });
}
