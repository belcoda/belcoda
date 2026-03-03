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
import { signUpForEventHelper, declineEventHelper } from '$lib/server/api/data/event/signup';
import { db } from '$lib/server/db';
import { getAdminOwnerOrgs, getAuthedTeams } from '$lib/server/api/utils/auth/permissions.js';
import { event, session } from '$lib/schema/drizzle.js';
import LexicalHtmlRenderer from '@tryghost/kg-lexical-html-renderer';
import type { ServerTransaction } from '@rocicorp/zero';
const lexicalRenderer = new LexicalHtmlRenderer();

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
	} = await db.transaction(async (tx) => {
		return await getDetails(params.eventSlug, params.organizationSlug, tx, locals.session);
	});

	const surveySchema = getSurveySchema(eventObj);
	const form = await superValidate(valibot(surveySchema));

	const renderedEvent = {
		...eventObj,
		description: eventObj.description ? await lexicalRenderer.render(eventObj.description) : null
	};
	return {
		event: renderedEvent,
		organization: organizationObj,
		whatsAppSignupLink,
		form,
		session: locals.session
	};
}

export const actions = {
	signup: async ({ request, params }) => {
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
			return error(404, 'Event not found');
		}
		const surveySchema = getSurveySchema(eventObj);
		const form = await superValidate(request, valibot(surveySchema));
		if (!form.valid) {
			return fail(400, { form });
		}
		try {
			await db.transaction(async (tx) => {
				await signUpForEventHelper({
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
			const theme = form.data.theme || 'default';
			return redirect(
				302,
				`/page/${params.organizationSlug}/events/${params.eventSlug}/signed-up${theme ? `?layout=${theme}` : ''}`
			);
		} catch (err) {
			if (
				err instanceof redirect ||
				(err && typeof err === 'object' && 'status' in err && 'location' in err)
			) {
				throw err;
			}
			return fail(400, { form, error: err instanceof Error ? err.message : String(err) });
		}
	},
	decline: async ({ request, params }) => {
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
			return error(404, 'Event not found');
		}
		const surveySchema = getSurveySchema(eventObj);
		const form = await superValidate(request, valibot(surveySchema));
		if (!form.valid) {
			return fail(400, { form });
		}
		try {
			await db.transaction(async (tx) => {
				await declineEventHelper({
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
			const theme = form.data.theme || 'default';
			return redirect(
				302,
				`/page/${params.organizationSlug}/events/${params.eventSlug}/declined${theme ? `?layout=${theme}` : ''}`
			);
		} catch (err) {
			if (
				err instanceof redirect ||
				(err && typeof err === 'object' && 'status' in err && 'location' in err)
			) {
				throw err;
			}
			return fail(400, { form, error: err instanceof Error ? err.message : String(err) });
		}
	}
};

async function getDetails(
	eventSlug: string,
	organizationSlug: string,
	tx: ServerTransaction,
	session: App.Locals['session'] | null
) {
	const organizationId = await _getOrganizationIdBySlugUnsafe({
		organizationSlug: organizationSlug
	});
	if (!organizationId) {
		return error(404, 'Organization not found');
	}
	const organizationObj = await getOrganizationByIdUnsafe({
		organizationId: organizationId,
		tx: tx
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

	const whatsAppSignupLink = actionCode
		? generateWhatsAppSignupLink({
				eventTitle: eventObj.title,
				whatsAppNumber: organizationObj.settings.whatsApp?.number,
				actionCode: actionCode.id
			})
		: null;

	return { event: eventObj, organization: organizationObj, whatsAppSignupLink, actionCode };
}
