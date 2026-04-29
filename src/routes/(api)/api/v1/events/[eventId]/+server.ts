import { json } from '@sveltejs/kit';
import {
	safeApiRouteQueryContext,
	processIncomingBody,
	processOutgoingBody
} from '$lib/server/utils/restApi';
import { db } from '$lib/server/db';
import { loadEventForApi, updateEvent, deleteEvent } from '$lib/server/api/data/event/event';
import { eventApiSchema, updateEventRest } from '$lib/schema/event';

export async function GET(event: import('@sveltejs/kit').RequestEvent) {
	const { ctx } = safeApiRouteQueryContext(event.locals.authorizedApiOrganization);
	const eventId = event.params.eventId!;
	const row = await db.transaction(async (tx) => await loadEventForApi({ ctx, tx, eventId }));
	return json(processOutgoingBody(row, eventApiSchema));
}

export async function PUT(event: import('@sveltejs/kit').RequestEvent) {
	const { organizationId, ctx } = safeApiRouteQueryContext(event.locals.authorizedApiOrganization);
	const eventId = event.params.eventId!;
	const body = await processIncomingBody(event, updateEventRest);
	const { startsAt, endsAt, ...rest } = body;
	const patch = {
		...rest,
		...(startsAt !== undefined ? { startsAt: startsAt.getTime() } : {}),
		...(endsAt !== undefined ? { endsAt: endsAt.getTime() } : {})
	};
	await db.transaction(async (tx) => {
		await updateEvent({
			ctx,
			tx,
			args: {
				metadata: { organizationId, eventId },
				input: patch
			}
		});
	});
	const refreshed = await db.transaction(async (tx) => loadEventForApi({ ctx, tx, eventId }));
	return json(processOutgoingBody(refreshed, eventApiSchema));
}

export async function DELETE(event: import('@sveltejs/kit').RequestEvent) {
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
