import { redirect, error } from '@sveltejs/kit';

import { getEventById } from '$lib/server/api/data/event/event.js';
import { getOrganization } from '$lib/server/api/data/organization';
import { getQueryContext } from '$lib/server/api/utils/auth/permissions.js';
import { generateOneTimeTokenFromRequest } from '$lib/server/api/utils/one_time_token_from_request';
import { db } from '$lib/server/db';
import { getEventLink } from '$lib/utils/events/link';

/**
 * Redirects the client to the event's public URL with a one-time authentication token.
 *
 * Verifies the current session, resolves the event and its organization, constructs the public event URL,
 * generates a one-time token tied to the incoming request and locale, appends the token as the `authToken`
 * query parameter, and issues a 302 redirect to that URL.
 *
 * @param params - Route parameters; must include `eventId`
 * @param locals - Request-local state containing `session` (user) and `locale`
 * @param request - Incoming request used to derive the one-time token
 * @throws {Error} Throws `error(401, 'Unauthorized')` when there is no active session.
 * @throws {Redirect} Throws `redirect(302, url)` to perform the HTTP redirect to the constructed URL.
 */
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
