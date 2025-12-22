import { organization, member } from '$lib/schema/drizzle';
import { db } from '$lib/server/db';
import { eq } from 'drizzle-orm';
export async function getOrganization({
	userId,
	organizationId
}: {
	userId: string;
	organizationId: string;
}): Promise<typeof organization.$inferSelect> {
	const result = await db.query.organization.findFirst({
		with: {
			memberships: {
				where: eq(member.userId, userId)
			}
		},
		where: eq(organization.id, organizationId)
	});
	if (!result) {
		throw new Error('Organization not found');
	}
	if (!result.memberships.some((m) => m.userId === userId)) {
		throw new Error('You are not a member of this organization');
	}
	return result;
}
