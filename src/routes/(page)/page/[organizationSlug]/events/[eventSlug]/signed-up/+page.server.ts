import pino from '$lib/pino';
const log = pino(import.meta.url);

import { error } from '@sveltejs/kit';
import { _getEventBySlugUnsafe } from '$lib/server/api/data/event/event';
import {
	_getOrganizationIdBySlugUnsafe,
	getOrganizationByIdUnsafe
} from '$lib/server/api/data/organization';
export const ssr = false;
import { db } from '$lib/server/db';
import { renderSanitizedDescription } from '$lib/server/utils/lexical/render_sanitized_description';

export async function load({ locals, params, url }) {
	log.debug(
		{
			locals,
			requestId: locals.requestId,
			time: Date.now(),
			sessionId: locals.session?.session.id,
			url: url.toString()
		},
		'[DEBUG] Route started loading'
	);

	const { event: eventObj, organization: organizationObj } = await getDetails(
		params.eventSlug,
		params.organizationSlug
	);

	// When pageHtml (TipTap) exists it is rendered directly (already sanitized at
	// write time), so skip the legacy Lexical render entirely.
	const renderedDescription = eventObj.pageHtml
		? null
		: await renderSanitizedDescription({
				description: eventObj.description,
				logContext: { eventId: eventObj.id }
			});

	return {
		event: { ...eventObj, description: renderedDescription },
		organization: organizationObj
	};
}

async function getDetails(eventSlug: string, organizationSlug: string) {
	const organizationId = await _getOrganizationIdBySlugUnsafe({
		organizationSlug: organizationSlug
	});
	if (!organizationId) {
		return error(404, 'Organization not found');
	}

	const organizationObj = await db.transaction(
		async (tx) =>
			await getOrganizationByIdUnsafe({
				organizationId: organizationId,
				tx: tx
			})
	);

	const eventObj = await _getEventBySlugUnsafe({
		eventSlug: eventSlug,
		organizationId: organizationId
	});

	if (!eventObj) {
		throw new Error('Event not found');
	}

	return { event: eventObj, organization: organizationObj };
}
