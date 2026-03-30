import type { RequestHandler } from '@sveltejs/kit';
import { drizzle } from '$lib/server/db';
import { eq, like, inArray } from 'drizzle-orm';
import * as schema from '$lib/schema/drizzle';
import { env } from '$env/dynamic/private';
import { error, json } from '@sveltejs/kit';

const TEST_ORG_SLUG = 'e2e-test-organization';
const TEST_USER_EMAIL_PATTERN = 'e2e-%@belcoda.test';

export const POST: RequestHandler = async () => {
	if (env.NODE_ENV === 'production') {
		throw error(403, 'This endpoint is only available in development mode');
	}

	try {
		const testUsers = await drizzle.query.user.findMany({
			where: like(schema.user.email, TEST_USER_EMAIL_PATTERN)
		});
		const testUserIds = testUsers.map((u) => u.id);

		const testOrg = await drizzle.query.organization.findFirst({
			where: eq(schema.organization.slug, TEST_ORG_SLUG)
		});

		if (testUserIds.length > 0) {
			await drizzle
				.update(schema.session)
				.set({ activeOrganizationId: null })
				.where(inArray(schema.session.userId, testUserIds));

			await drizzle.delete(schema.session).where(inArray(schema.session.userId, testUserIds));
		}

		if (testOrg) {
			await drizzle
				.delete(schema.invitation)
				.where(eq(schema.invitation.organizationId, testOrg.id));

			await drizzle.delete(schema.member).where(eq(schema.member.organizationId, testOrg.id));

			await drizzle.delete(schema.organization).where(eq(schema.organization.id, testOrg.id));
		}

		if (testUserIds.length > 0) {
			await drizzle.delete(schema.account).where(inArray(schema.account.userId, testUserIds));
			await drizzle.delete(schema.user).where(inArray(schema.user.id, testUserIds));
		}

		return json({ success: true, message: 'Test data cleaned up' });
	} catch (err) {
		console.error('Failed to cleanup test data:', err);
		throw error(500, 'Failed to cleanup test data');
	}
};
