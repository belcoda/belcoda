import { json } from '@sveltejs/kit';
import {
	buildApiListFilter,
	buildApiListResponse,
	safeApiRouteQueryContext,
	processIncomingBody,
	processOutgoingBody
} from '$lib/server/utils/restApi';
import { db } from '$lib/server/db';
import {
	listEventSignupsForOrg,
	countEventSignupsForOrg,
	createEventSignup
} from '$lib/server/api/data/event/signup';
import { array } from 'valibot';
import { eventSignupApiSchema, createEventSignupApiBody } from '$lib/schema/event-signup';
import type { EventSignupStatus } from '$lib/schema/event/settings';
import { v7 as uuidv7 } from 'uuid';

function buildEventSignupsListInput(organizationId: string, eventId: string, url: URL) {
	const base = buildApiListFilter({ organizationId, url });
	const tagId = url.searchParams.get('tagId');
	const teamId = url.searchParams.get('teamId');
	const statusRaw = url.searchParams.get('signupStatus');
	const statusList: EventSignupStatus[] = [
		'incomplete',
		'signup',
		'attended',
		'noshow',
		'notattending',
		'cancelled',
		'deleted'
	];
	const statusParsed =
		statusRaw && statusList.includes(statusRaw as EventSignupStatus)
			? (statusRaw as EventSignupStatus)
			: undefined;

	return {
		...base,
		eventId,
		tagId: tagId ?? undefined,
		status: statusParsed,
		includeDeleted: url.searchParams.get('includeDeleted') === 'true' ? true : undefined,
		includeIncomplete: url.searchParams.get('includeIncomplete') === 'true' ? true : undefined,
		teamId: teamId ?? null
	};
}

export async function GET(event: import('@sveltejs/kit').RequestEvent) {
	const { organizationId, ctx } = safeApiRouteQueryContext(event.locals.authorizedApiOrganization);
	const eventId = event.params.eventId!;
	const input = buildEventSignupsListInput(organizationId, eventId, event.url);

	const result = await db.transaction(async (tx) => {
		const junctionRows = await listEventSignupsForOrg({ ctx, input, tx });
		const count = await countEventSignupsForOrg({ tx, input });
		return { junctionRows, count };
	});

	const withoutPersonRows = result.junctionRows.map((row: { person?: unknown }) => {
		const { person: _omit, ...signup } = row as Record<string, unknown> & {
			person?: unknown;
		};
		return signup;
	});

	return json(
		buildApiListResponse({
			data: processOutgoingBody(withoutPersonRows, array(eventSignupApiSchema)),
			count: result.count
		})
	);
}

export async function POST(event: import('@sveltejs/kit').RequestEvent) {
	const { organizationId, ctx } = safeApiRouteQueryContext(event.locals.authorizedApiOrganization);
	const eventId = event.params.eventId!;
	const body = await processIncomingBody(event, createEventSignupApiBody);
	const created = await db.transaction(async (tx) => {
		return await createEventSignup({
			ctx,
			tx,
			args: {
				metadata: {
					organizationId,
					eventId,
					personId: body.personId,
					eventSignupId: uuidv7()
				},
				input: {
					eventId,
					personId: body.personId,
					details: body.details,
					status: body.status
				}
			}
		});
	});
	return json(processOutgoingBody(created, eventSignupApiSchema));
}
