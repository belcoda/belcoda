import { readEventQuery, inputSchema, outputSchema } from '$lib/zero/query/event/read';
import { runQuery } from '$lib/server/db/query.js';
import { error } from '@sveltejs/kit';
import { getEventLink } from '$lib/utils/events/link';
import { getOrganization } from '$lib/server/api/data/organization';
export async function load({ params, locals }) {
	if (!locals.session) {
		return error(401, 'Unauthorized');
	}
	const { eventId } = params;

	const event = await runQuery({
		query: readEventQuery,
		inputSchema,
		outputSchema,
		input: { eventId },
		userId: locals.session.user.id
	});

	if (event.status !== 200 || !event.data || !('id' in event.data)) {
		return error(404, 'Event not found');
	}

	const organization = await getOrganization({
		userId: locals.session.user.id,
		organizationId: event.data.organizationId
	});

	const url = getEventLink({
		eventSlug: event.data.slug,
		organizationSlug: organization.slug
	});

	return { url };
}
