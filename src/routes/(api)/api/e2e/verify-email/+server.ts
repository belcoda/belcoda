import type { RequestHandler } from '@sveltejs/kit';
import { drizzle } from '$lib/server/db';
import { eq } from 'drizzle-orm';
import * as schema from '$lib/schema/drizzle';
import { env } from '$env/dynamic/private';
import { error, json } from '@sveltejs/kit';

/**
 * This endpoint is ONLY available in development mode for E2E testing.
 * It allows email verification without sending actual emails.
 *
 * POST /api/e2e/verify-email
 * Body: { email: string }
 */

export const POST: RequestHandler = async ({ request }) => {
	// Only allow in development/staging mode
	if (env.NODE_ENV === 'production') {
		throw error(403, 'This endpoint is only available in development mode');
	}

	const body = await request.json();
	const { email } = body;

	if (!email || typeof email !== 'string') {
		throw error(400, 'Email is required');
	}

	try {
		const result = await drizzle
			.update(schema.user)
			.set({ emailVerified: true })
			.where(eq(schema.user.email, email))
			.returning();

		if (result.length === 0) {
			return json({ success: false, message: 'User not found' }, { status: 404 });
		}

		return json({ success: true, message: 'Email verified' });
	} catch (err) {
		console.error('Failed to verify email:', err);
		throw error(500, 'Failed to verify email');
	}
};
