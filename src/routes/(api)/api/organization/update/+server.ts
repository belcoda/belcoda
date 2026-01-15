import { json, error } from '@sveltejs/kit';
import { parse } from 'valibot';
import { updateOrganization } from '$lib/schema/organization';
import { getOrganization } from '$lib/server/api/data/organization';
import { db } from '$lib/server/db';
import { organization } from '$lib/schema/drizzle';
import { eq } from 'drizzle-orm';
import { getQueryContext } from '$lib/server/api/utils/auth/permissions';
import pino from '$lib/pino';
import { renderValiError } from '$lib/schema/helpers';
const log = pino(import.meta.url);

export async function POST(event) {
	try {
		// Get user ID from session
		const userId = event.locals.session?.user.id;
		if (!userId) {
			return error(401, 'Unauthorized');
		}

		const body = await event.request.json();
		const { organizationId, ...updateData } = body;

		if (!organizationId) {
			return error(400, 'Organization ID is required');
		}

		// Verify user has admin/owner permissions for this organization
		const queryContext = await getQueryContext(userId);
		const isAdminOrOwner =
			queryContext.adminOrgs.includes(organizationId) ||
			queryContext.ownerOrgs.includes(organizationId);

		if (!isAdminOrOwner) {
			return error(403, 'You must be an admin or owner to update organization settings');
		}

		// Validate update data
		let validatedUpdate;
		try {
			validatedUpdate = parse(updateOrganization, updateData);
		} catch (err) {
			log.warn({ error: err, updateData }, 'Error validating update data');
			return json(
				{ error: 'Invalid theme settings', details: renderValiError(err) },
				{ status: 400 }
			);
		}

		// Merge settings if provided (deep merge to preserve other sections)
		const currentOrg = await getOrganization({ userId, organizationId });
		let mergedSettings = currentOrg.settings;
		if (validatedUpdate.settings) {
			mergedSettings = {
				...currentOrg.settings,
				...validatedUpdate.settings,
				whatsApp: {
					...currentOrg.settings.whatsApp,
					...(validatedUpdate.settings.whatsApp || {})
				},
				email: {
					...currentOrg.settings.email,
					...(validatedUpdate.settings.email || {}),
					systemFromIdentity: {
						...currentOrg.settings.email.systemFromIdentity,
						...(validatedUpdate.settings.email?.systemFromIdentity || {})
					}
				},
				theme: {
					...(currentOrg.settings.theme || {}),
					...(validatedUpdate.settings.theme || {})
				}
			};
		}

		await db
			.update(organization)
			.set({
				...validatedUpdate,
				settings: mergedSettings,
				updatedAt: new Date()
			})
			.where(eq(organization.id, organizationId));

		return json({ success: true });
	} catch (err) {
		log.error({ error: err }, 'Error updating organization');
		if (err instanceof Error && err.message === 'Organization not found') {
			return error(404, 'Organization not found');
		}
		if (err instanceof Error && err.message === 'You are not a member of this organization') {
			return error(403, 'You are not a member of this organization');
		}
		return error(500, 'Internal server error');
	}
}
