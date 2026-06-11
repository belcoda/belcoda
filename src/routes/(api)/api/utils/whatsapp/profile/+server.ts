import { json, error } from '@sveltejs/kit';
import * as v from 'valibot';
import pino from '$lib/pino';
import { getQueryContext } from '$lib/server/api/utils/auth/permissions';
import { getOrganization } from '$lib/server/api/data/organization';
import {
	getWhatsappBusinessAccountSummary,
	getWhatsappPhoneNumberProfile,
	updateWhatsappPhoneNumberProfile
} from '$lib/server/utils/whatsapp/ycloud/ycloud_api';
import {
	updateWhatsappBusinessProfileInput,
	whatsappProfileAndAccountResponseSchema
} from '$lib/schema/whatsapp/ycloud/profile';
import { renderValiError } from '$lib/schema/helpers';

const log = pino(import.meta.url);

function getOrganizationIdFromUrl(url: URL): string | null {
	return url.searchParams.get('organizationId');
}

async function getAuthorizedWhatsappConfig(event: {
	locals: App.Locals;
	url: URL;
}): Promise<{ wabaId: string; phoneNumber: string }> {
	if (!event.locals.session?.user?.id) {
		error(401, 'Unauthorized');
	}

	const userId = event.locals.session.user.id;
	const organizationId = getOrganizationIdFromUrl(event.url);
	if (!organizationId) {
		error(400, 'organizationId query parameter is required');
	}

	const ctx = await getQueryContext(userId);
	if (![...ctx.adminOrgs, ...ctx.ownerOrgs].includes(organizationId)) {
		error(403, 'You are not authorized to manage this organization WhatsApp profile');
	}

	let org;
	try {
		org = await getOrganization({ userId, organizationId });
	} catch (e) {
		if (e instanceof Error && e.message === 'Organization not found') {
			error(404, 'Organization not found');
		}
		throw e;
	}

	const wabaId = org.settings.whatsApp.wabaId;
	const phoneNumber = org.settings.whatsApp.number;
	if (!wabaId || !phoneNumber) {
		error(400, 'WhatsApp Business Account is not configured for this organization');
	}

	return { wabaId, phoneNumber };
}

export async function GET(event) {
	try {
		const { wabaId, phoneNumber } = await getAuthorizedWhatsappConfig(event);
		const [profile, waba] = await Promise.all([
			getWhatsappPhoneNumberProfile({ wabaId, phoneNumber }),
			getWhatsappBusinessAccountSummary({ wabaId })
		]);
		return json(v.parse(whatsappProfileAndAccountResponseSchema, { profile, waba }));
	} catch (err) {
		if (err && typeof err === 'object' && 'status' in err && typeof err.status === 'number') {
			throw err;
		}
		log.error({ err }, 'Error retrieving WhatsApp business profile');
		error(500, 'Failed to retrieve WhatsApp business profile');
	}
}

export async function PATCH(event) {
	try {
		const { wabaId, phoneNumber } = await getAuthorizedWhatsappConfig(event);

		let parsed: v.InferOutput<typeof updateWhatsappBusinessProfileInput>;
		try {
			const body = await event.request.json();
			parsed = v.parse(updateWhatsappBusinessProfileInput, body);
		} catch (err) {
			if (v.isValiError(err)) {
				const rendered = renderValiError(err);
				log.warn({ issues: rendered }, 'Invalid WhatsApp profile update body');
				error(400, rendered.isValiError ? rendered.message : 'Invalid request body');
			}
			error(400, 'Invalid request body');
		}

		const profile = await updateWhatsappPhoneNumberProfile({
			wabaId,
			phoneNumber,
			profile: parsed
		});
		return json(profile);
	} catch (err) {
		if (err && typeof err === 'object' && 'status' in err && typeof err.status === 'number') {
			throw err;
		}
		log.error({ err }, 'Error updating WhatsApp business profile');
		error(500, 'Failed to update WhatsApp business profile');
	}
}
