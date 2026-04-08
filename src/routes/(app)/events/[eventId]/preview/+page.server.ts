import { redirect, error } from '@sveltejs/kit';

import { getEventById } from '$lib/server/api/data/event/event.js';
import { getOrganization } from '$lib/server/api/data/organization';
import { getQueryContext } from '$lib/server/api/utils/auth/permissions.js';
import { generateOneTimeTokenFromRequest } from '$lib/server/api/utils/one_time_token_from_request';
import { db } from '$lib/server/db';
import { getEventLink } from '$lib/utils/events/link';

export async function load({ params, locals, request }) {
	if (!locals.session) {
		throw error(401, 'Unauthorized');
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

	const publicUrl = getEventLink({
		eventSlug: event.slug,
		organizationSlug: organization.slug
	});

	const token = await generateOneTimeTokenFromRequest(request, locals.locale);
	const redirectUrl = new URL(publicUrl);
	redirectUrl.searchParams.set('authToken', token);

	throw redirect(302, redirectUrl.toString());
}
