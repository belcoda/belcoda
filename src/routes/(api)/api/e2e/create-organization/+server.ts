import type { RequestHandler } from '@sveltejs/kit';
import { drizzle } from '$lib/server/db';
import { eq } from 'drizzle-orm';
import * as schema from '$lib/schema/drizzle';
import { defaultOrganizationSettings } from '$lib/schema/organization/settings';
import { error, json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { E2E_DUMMY_WHATSAPP_NUMBER, E2E_MOCK_WABA_ID } from '../../../../../../e2e/helpers/config';
import { createDefaultTemplate } from '$lib/server/db/seed/whatsapp/template';

/**
 * This endpoint is ONLY available in development mode for E2E testing.
 * It creates an organization and assigns the owner directly, bypassing better-auth's API validation.
 *
 * POST /api/e2e/create-organization
 * Body: {
 *   name: string,
 *   ownerEmail: string,
 *   members?: Array<{ email: string, role: 'admin' | 'member' }> (optional)
 * }
 */

export const POST: RequestHandler = async ({ request }) => {
	if (env.NODE_ENV === 'production') {
		throw error(403, 'This endpoint is only available in development mode');
	}

	const body = await request.json();
	const { name, ownerEmail, members = [], wabaId } = body;

	if (!name || typeof name !== 'string' || !ownerEmail || typeof ownerEmail !== 'string') {
		throw error(400, 'name and ownerEmail are required');
	}

	if (wabaId != null && typeof wabaId !== 'string') {
		throw error(400, 'wabaId must be a string');
	}

	try {
		// Find the owner user
		const owner = await drizzle.query.user.findFirst({
			where: eq(schema.user.email, ownerEmail)
		});

		if (!owner) {
			return json({ success: false, message: 'Owner user not found' }, { status: 404 });
		}

		const slug = name.toLowerCase().replace(/\s+/g, '-');
		const now = new Date();
		const orgId = crypto.randomUUID();
		const effectiveWabaId = wabaId?.trim() || E2E_MOCK_WABA_ID;
		const defaultWhatsappTemplateId = crypto.randomUUID();
		const dummyWhatsappNumber = E2E_DUMMY_WHATSAPP_NUMBER;
		const settings = defaultOrganizationSettings();
		settings.whatsApp = {
			...settings.whatsApp,
			wabaId: effectiveWabaId,
			number: dummyWhatsappNumber,
			defaultTemplateId: defaultWhatsappTemplateId
		};

		// Check if org already exists
		const existing = await drizzle.query.organization.findFirst({
			where: eq(schema.organization.slug, slug)
		});

		if (existing) {
			return json(
				{ success: false, message: 'Organization already exists', id: existing.id },
				{ status: 409 }
			);
		}

		// Create organization
		await drizzle.insert(schema.organization).values({
			id: orgId,
			name,
			slug,
			country: 'US',
			defaultLanguage: 'en',
			defaultTimezone: 'America/New_York',
			settings,
			balance: 0,
			createdAt: now,
			updatedAt: now
		});

		// Create the default WhatsApp template referenced by `defaultTemplateId`.
		// This ensures WhatsApp flows are considered "activated" in E2E.
		await drizzle.insert(schema.whatsappTemplate).values(
			createDefaultTemplate({
				organizationId: orgId,
				id: defaultWhatsappTemplateId
			})
		);

		// Create owner member record
		await drizzle.insert(schema.member).values({
			id: crypto.randomUUID(),
			userId: owner.id,
			organizationId: orgId,
			role: 'owner',
			createdAt: now
		});

		if (Array.isArray(members) && members.length > 0) {
			for (const memberData of members) {
				const memberUser = await drizzle.query.user.findFirst({
					where: eq(schema.user.email, memberData.email)
				});

				if (memberUser) {
					await drizzle.insert(schema.member).values({
						id: crypto.randomUUID(),
						userId: memberUser.id,
						organizationId: orgId,
						role: memberData.role || 'member',
						createdAt: now
					});
				}
			}
		}

		return json({ success: true, id: orgId, message: 'Organization created' });
	} catch (err) {
		console.error('Failed to create organization:', err);
		throw error(500, 'Failed to create organization');
	}
};
