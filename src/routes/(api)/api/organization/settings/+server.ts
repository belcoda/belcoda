import { json, error } from '@sveltejs/kit';
import { parse } from 'valibot';
import { updateOrganization } from '$lib/schema/organization';
import { db } from '$lib/server/db';
import { organization } from '$lib/schema/drizzle';
import { eq } from 'drizzle-orm';
import { getQueryContext } from '$lib/server/api/utils/auth/permissions';
import pino from '$lib/pino';

const log = pino(import.meta.url);

export async function PUT(event) {
	if (!event.locals.session?.user?.id) {
		return error(401, 'Unauthorized');
	}

	const userId = event.locals.session.user.id;
	const ctx = await getQueryContext(userId);

	try {
		const body = await event.request.json();
		const parsed = parse(updateOrganization, body);

		const organizationId = body.organizationId || event.locals.session.session.activeOrganizationId;

		if (!organizationId) {
			return error(400, 'Organization ID is required');
		}

		if (![...ctx.adminOrgs, ...ctx.ownerOrgs].includes(organizationId)) {
			return error(403, 'You are not authorized to update this organization');
		}

		// Get current organization to merge settings properly
		const currentOrg = await db.query.organization.findFirst({
			where: eq(organization.id, organizationId)
		});

		if (!currentOrg) {
			return error(404, 'Organization not found');
		}

		// Merge settings if only partial update
		const updatedSettings = parsed.settings
			? {
					...currentOrg.settings,
					email: parsed.settings.email
						? {
								...currentOrg.settings?.email,
								systemFromIdentity: parsed.settings.email.systemFromIdentity
									? {
											...currentOrg.settings?.email?.systemFromIdentity,
											...parsed.settings.email.systemFromIdentity
										}
									: currentOrg.settings?.email?.systemFromIdentity,
								defaultFromSignatureId:
									parsed.settings.email.defaultFromSignatureId !== undefined
										? parsed.settings.email.defaultFromSignatureId
										: currentOrg.settings?.email?.defaultFromSignatureId
							}
						: currentOrg.settings?.email,
					whatsApp: parsed.settings.whatsApp
						? {
								...currentOrg.settings?.whatsApp,
								...parsed.settings.whatsApp
							}
						: currentOrg.settings?.whatsApp
				}
			: currentOrg.settings;

		// Update organization
		const [updated] = await db
			.update(organization)
			.set({
				...parsed,
				settings: updatedSettings,
				updatedAt: new Date()
			})
			.where(eq(organization.id, organizationId))
			.returning();

		if (!updated) {
			return error(500, 'Failed to update organization');
		}

		return json(updated);
	} catch (err) {
		log.error({ err }, 'Error updating organization settings');
		if (err instanceof Error && err.message.includes('parse')) {
			return error(400, 'Invalid request data');
		}
		return error(500, 'Failed to update organization settings');
	}
}
