import { organization, member } from '$lib/schema/drizzle';
import { db } from '$lib/server/db';
import type { Transaction } from '$lib/server/db/zeroDrizzle';
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

export async function getOrganizationByIdUnsafe({
	organizationId,
	tx
}: {
	organizationId: string;
	tx: Transaction;
}): Promise<typeof organization.$inferSelect> {
	const [result] = await tx.dbTransaction.wrappedTransaction
		.select()
		.from(organization)
		.where(eq(organization.id, organizationId));
	if (!result) {
		throw new Error('Organization not found');
	}
	return result;
}

export async function _getOrganizationIdBySlugUnsafe({
	organizationSlug
}: {
	organizationSlug: string;
}): Promise<string> {
	const result = await db.query.organization.findFirst({
		where: eq(organization.slug, organizationSlug)
	});
	if (!result) {
		throw new Error('Organization not found');
	}
	return result.id;
}
