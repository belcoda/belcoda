import { readEventQuery, inputSchema, outputSchema } from '$lib/zero/query/event/read';
import { db } from '$lib/server/db';
import { error } from '@sveltejs/kit';
import { getEventLink } from '$lib/utils/events/link';
import { getEventById } from '$lib/server/api/data/event/event.js';
import { getOrganization } from '$lib/server/api/data/organization';
import { getQueryContext } from '$lib/server/api/utils/auth/permissions.js';
export async function load({ params, locals }) {
	if (!locals.session) {
		return error(401, 'Unauthorized');
	}
	const { eventId } = params;
	const ctx = await getQueryContext(locals.session.user.id);
	const event = await db.transaction(async (tx) => {
		return await getEventById({
			eventId,
			ctx,
			tx
		});
	});

	const organization = await getOrganization({
		userId: locals.session.user.id,
		organizationId: event.organizationId
	});

	const url = getEventLink({
		eventSlug: event.slug,
		organizationSlug: organization.slug
	});

	return { url };
}
