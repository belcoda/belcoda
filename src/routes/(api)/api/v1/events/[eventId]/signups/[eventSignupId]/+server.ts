import { json, error } from '@sveltejs/kit';
import {
	safeApiRouteQueryContext,
	processIncomingBody,
	processOutgoingBody
} from '$lib/server/utils/restApi';
import { db } from '$lib/server/db';
import {
	getEventSignupForApi,
	updateEventSignup as persistEventSignupUpdate
} from '$lib/server/api/data/event/signup';
import {
	eventSignupApiSchema,
	updateEventSignup as updateEventSignupRest
} from '$lib/schema/event-signup';

export async function GET(event: import('@sveltejs/kit').RequestEvent) {
	const { ctx } = safeApiRouteQueryContext(event.locals.authorizedApiOrganization);
	const eventId = event.params.eventId!;
	const eventSignupId = event.params.eventSignupId!;

	const row = await db.transaction(async (tx) => {
		return await getEventSignupForApi({ ctx, tx, args: { eventSignupId } });
	});
	if (row.eventId !== eventId) {
		throw error(404, { message: 'Event signup not found' });
	}

	return json(processOutgoingBody(row, eventSignupApiSchema));
}

export async function PUT(event: import('@sveltejs/kit').RequestEvent) {
	const { organizationId, ctx } = safeApiRouteQueryContext(event.locals.authorizedApiOrganization);
	const eventId = event.params.eventId!;
	const eventSignupId = event.params.eventSignupId!;
	const inputBody = await processIncomingBody(event, updateEventSignupRest);

	const updated = await db.transaction(async (tx) => {
		const existing = await getEventSignupForApi({ ctx, tx, args: { eventSignupId } });
		if (existing.eventId !== eventId) {
			throw error(404, { message: 'Event signup not found' });
		}
		await persistEventSignupUpdate({
			ctx,
			tx,
			args: {
				metadata: {
					organizationId,
					eventId,
					personId: existing.personId,
					eventSignupId
				},
				input: inputBody
			}
		});
		return await getEventSignupForApi({ ctx, tx, args: { eventSignupId } });
	});

	return json(processOutgoingBody(updated, eventSignupApiSchema));
}

export async function DELETE(event: import('@sveltejs/kit').RequestEvent) {
	const { organizationId, ctx } = safeApiRouteQueryContext(event.locals.authorizedApiOrganization);
	const eventId = event.params.eventId!;
	const eventSignupId = event.params.eventSignupId!;

	await db.transaction(async (tx) => {
		const existing = await getEventSignupForApi({ ctx, tx, args: { eventSignupId } });
		if (existing.eventId !== eventId) {
			throw error(404, { message: 'Event signup not found' });
		}
		await persistEventSignupUpdate({
			ctx,
			tx,
			args: {
				metadata: {
					organizationId,
					eventId,
					personId: existing.personId,
					eventSignupId
				},
				input: { status: 'deleted' }
			}
		});
	});

	return new Response(null, { status: 204 });
}
