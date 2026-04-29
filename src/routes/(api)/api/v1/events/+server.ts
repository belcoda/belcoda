import { json } from '@sveltejs/kit';
import {
	buildApiListFilter,
	buildApiListResponse,
	safeApiRouteQueryContext,
	processIncomingBody,
	processOutgoingBody
} from '$lib/server/utils/restApi';
import { db } from '$lib/server/db';
import { listEventsForOrg, countEventsForOrg, createEvent } from '$lib/server/api/data/event/event';
import { array } from 'valibot';
import { eventApiSchema, createEventRest } from '$lib/schema/event';
import { v7 as uuidv7 } from 'uuid';

function buildEventsListInput(organizationId: string, url: URL) {
	const base = buildApiListFilter({ organizationId, url });
	const tagId = url.searchParams.get('tagId');
	const teamId = url.searchParams.get('teamId');
	const eventType = url.searchParams.get('eventType');
	const status = url.searchParams.get('status');
	const hasSignups =
		url.searchParams.get('hasSignups') === 'true'
			? true
			: url.searchParams.get('hasSignups') === 'false'
				? false
				: null;
	const isArchived =
		url.searchParams.get('isArchived') === 'true'
			? true
			: url.searchParams.get('isArchived') === 'false'
				? false
				: null;
	const rangeStart = url.searchParams.get('dateRangeStart');
	const rangeEnd = url.searchParams.get('dateRangeEnd');
	const dateRange =
		rangeStart != null || rangeEnd != null
			? {
					start: rangeStart != null ? Number.parseInt(rangeStart, 10) : null,
					end: rangeEnd != null ? Number.parseInt(rangeEnd, 10) : null
				}
			: null;

	return {
		...base,
		tagId: tagId ?? null,
		teamId: teamId ?? null,
		eventType:
			eventType === 'online' || eventType === 'in-person'
				? (eventType as 'online' | 'in-person')
				: null,
		status:
			status === 'draft' || status === 'published' || status === 'cancelled'
				? (status as 'draft' | 'published' | 'cancelled')
				: null,
		hasSignups,
		isArchived,
		dateRange
	};
}

export async function GET(event: import('@sveltejs/kit').RequestEvent) {
	const { organizationId, ctx } = safeApiRouteQueryContext(event.locals.authorizedApiOrganization);
	const input = buildEventsListInput(organizationId, event.url);

	const result = await db.transaction(async (tx) => {
		const events = await listEventsForOrg({ ctx, input, tx });
		const count = await countEventsForOrg({ tx, input });
		return { events, count };
	});

	return json(
		buildApiListResponse({
			data: processOutgoingBody(result.events, array(eventApiSchema)),
			count: result.count
		})
	);
}

export async function POST(event: import('@sveltejs/kit').RequestEvent) {
	const { organizationId, ctx } = safeApiRouteQueryContext(event.locals.authorizedApiOrganization);
	const body = await processIncomingBody(event, createEventRest);
	const created = await db.transaction(async (tx) => {
		return await createEvent({
			ctx,
			tx,
			args: {
				metadata: { organizationId, eventId: uuidv7() },
				input: {
					...body,
					startsAt: body.startsAt.getTime(),
					endsAt: body.endsAt.getTime(),
					description: body.description ?? null
				}
			}
		});
	});
	return json(processOutgoingBody(created, eventApiSchema));
}
