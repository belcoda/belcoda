import type { RequestHandler } from '@sveltejs/kit';
import { drizzle } from '$lib/server/db';
import { eq, and } from 'drizzle-orm';
import * as schema from '$lib/schema/drizzle';
import { env } from '$env/dynamic/private';
import { error, json } from '@sveltejs/kit';

/**
 * Dev-only endpoint for E2E tests to retrieve a pending invitation ID without
 * needing to read an actual email.
 *
 * POST /api/e2e/get-invitation
 * Body: { email: string, orgSlug: string }
 */
export const POST: RequestHandler = async ({ request }) => {
	if (env.NODE_ENV === 'production') {
		throw error(403, 'This endpoint is only available in development mode');
	}

	const body = await request.json();
	const { email, orgSlug } = body;

	if (!email || typeof email !== 'string') {
		throw error(400, 'email is required');
	}
	if (!orgSlug || typeof orgSlug !== 'string') {
		throw error(400, 'orgSlug is required');
	}

	const org = await drizzle.query.organization.findFirst({
		where: eq(schema.organization.slug, orgSlug)
	});

	if (!org) {
		return json(
			{ invitationId: null, message: `Organization not found: ${orgSlug}` },
			{ status: 404 }
		);
	}

	const invitation = await drizzle.query.invitation.findFirst({
		where: and(
			eq(schema.invitation.email, email),
			eq(schema.invitation.organizationId, org.id),
			eq(schema.invitation.status, 'pending')
		)
	});

	if (!invitation) {
		return json({ invitationId: null, message: 'No pending invitation found' }, { status: 404 });
	}

	return json({ invitationId: invitation.id });
};
