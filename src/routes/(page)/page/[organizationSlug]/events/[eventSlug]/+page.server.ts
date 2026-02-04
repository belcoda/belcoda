import pino from '$lib/pino';
const log = pino(import.meta.url);
import { error, redirect, fail } from '@sveltejs/kit';
import { _getEventBySlugUnsafe } from '$lib/server/api/data/event/event';
import {
	_getOrganizationIdBySlugUnsafe,
	getOrganizationByIdUnsafe
} from '$lib/server/api/data/organization';
import { generateWhatsAppSignupLink } from '$lib/utils/events/link';
import { _getEventActionCodeUnsafe } from '$lib/server/api/data/event/check';

import { superValidate } from 'sveltekit-superforms';
import { valibot } from 'sveltekit-superforms/adapters';
import { parse } from 'valibot';
import { getSurveySchema, type SurveySchema } from '$lib/schema/survey/questions';
import { type EventSignupHelper, eventSignupHelper } from '$lib/schema/event-signup';
import { signUpForEventHelper } from '$lib/server/api/data/event/signup';
import { db } from '$lib/server/db/zeroDrizzle';
import { getAdminOwnerOrgs, getAuthedTeams } from '$lib/server/api/utils/auth/permissions.js';
import { event, session } from '$lib/schema/drizzle.js';

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
	const {
		event: eventObj,
		organization: organizationObj,
		whatsAppSignupLink
	} = await getDetails(params.eventSlug, params.organizationSlug, locals.session).catch((err) => {
		if (err instanceof Error && err.message === 'Unknown event') {
			return error(404, 'Unknown event');
		}
		if (err instanceof Error && err.message === 'You are not authorized to access this resource') {
			return error(403, 'You are not authorized to access this resource');
		}
		return error(500, 'Unknown error');
	});

	const surveySchema = getSurveySchema(eventObj);
	const form = await superValidate(valibot(surveySchema));

	return {
		event: eventObj,
		organization: organizationObj,
		whatsAppSignupLink,
		form,
		session: locals.session
	};
}

export const actions = {
	default: async ({ request, params }) => {
		try {
			const organizationId = await _getOrganizationIdBySlugUnsafe({
				organizationSlug: params.organizationSlug
			});
			if (!organizationId) {
				return error(404, 'Organization not found');
			}
			const eventObj = await _getEventBySlugUnsafe({
				eventSlug: params.eventSlug,
				organizationId: organizationId
			});
			if (!eventObj) {
				throw new Error('Event not found');
			}
			const surveySchema = getSurveySchema(eventObj);
			const form = await superValidate(request, valibot(surveySchema));
			if (!form.valid) {
				return fail(400, { form });
			}
			//sign up for the event
			const helper: EventSignupHelper = {
				organizationId: organizationId,
				person: form.data.person,
				addedFrom: {
					type: 'added_from_event',
					eventSignupId: eventObj.id
				},
				eventId: eventObj.id,
				details: {
					channel: { type: 'eventPage' },
					customFields: form.data.customFields
				}
			};

			await db.transaction(async (tx) => {
				const eventSignup = await signUpForEventHelper({
					tx,
					eventId: eventObj.id,
					personAction: form.data.person,
					signupDetails: {
						channel: { type: 'eventPage' },
						customFields: form.data.customFields
					},
					organizationId
				});
			});

			return redirect(302, `/page/${params.organizationSlug}/events/${params.eventSlug}/signed-up`);
		} catch (err) {
			return fail(400, err);
		}
	}
};

async function getDetails(
	eventSlug: string,
	organizationSlug: string,
	session: App.Locals['session'] | null
) {
	const organizationId = await _getOrganizationIdBySlugUnsafe({
		organizationSlug: organizationSlug
	});
	if (!organizationId) {
		return error(404, 'Organization not found');
	}
	const organizationObj = await getOrganizationByIdUnsafe({
		organizationId: organizationId
	});

	const eventObj = await _getEventBySlugUnsafe({
		eventSlug: eventSlug,
		organizationId: organizationId
	});

	if (!eventObj) {
		throw new Error('Event not found');
	}
	if (!session && !eventObj.published) {
		throw new Error('Unknown event');
	}

	if (session) {
		const authedTeams = await getAuthedTeams(session.user.id);
		const adminOwnerOrgs = await getAdminOwnerOrgs(session.user.id);
		if (
			eventObj.teamId &&
			!authedTeams.includes(eventObj.teamId) &&
			!adminOwnerOrgs.admin.includes(eventObj.organizationId) &&
			!adminOwnerOrgs.owner.includes(eventObj.organizationId)
		) {
			throw new Error('You are not authorized to access this resource');
		}
	}

	const actionCode = await _getEventActionCodeUnsafe({ eventId: eventObj.id });
	if (!actionCode) {
		throw new Error('Action code not found');
	}

	const whatsAppSignupLink = generateWhatsAppSignupLink(eventObj.title, actionCode.id);

	return { event: eventObj, organization: organizationObj, whatsAppSignupLink, actionCode };
}
