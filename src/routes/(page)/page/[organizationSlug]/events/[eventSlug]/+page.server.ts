import pino from '$lib/pino';
const log = pino(import.meta.url);
import { error } from '@sveltejs/kit';
import { _getEventBySlugUnsafe } from '$lib/server/api/data/event/event';
import {
	_getOrganizationIdBySlugUnsafe,
	getOrganizationByIdUnsafe
} from '$lib/server/api/data/organization';
import { db } from '$lib/server/db/zeroDrizzle';
import { organization, event } from '$lib/schema/drizzle';
export async function load({ locals, params, url }) {
	log.debug(
		{
			locals,
			requestId: locals.requestId,
			time: new Date().getTime(),
			sessionId: locals.session?.session.id,
			url: url.toString()
		},
		'[DEBUG] Route started loading'
	);
	const session = locals.session;
	let organizationObj: typeof organization.$inferSelect | null = null;
	let eventObj: typeof event.$inferSelect | null | undefined = null;
	await db.transaction(async (tx) => {
		const organizationId = await _getOrganizationIdBySlugUnsafe({
			organizationSlug: params.organizationSlug
		});
		if (!organizationId) {
			return error(404, 'Organization not found');
		}

		organizationObj = await getOrganizationByIdUnsafe({
			organizationId: organizationId,
			tx
		});
		if (!organizationObj) {
			return error(404, 'Organization not found');
		}

		eventObj = await _getEventBySlugUnsafe({
			eventSlug: params.eventSlug,
			organizationId: organizationId
		});

		if (!eventObj) {
			return error(404, 'Event not found');
		}

		if (eventObj.published === false) {
			return error(404, 'Event not found');
		}
	});
	return { session, event: eventObj, organization: organizationObj };
}
