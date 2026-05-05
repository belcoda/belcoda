import type { ServerTransaction } from '@rocicorp/zero';
import { type QueryContext, builder } from '$lib/zero/schema';
import { and, eq } from 'drizzle-orm';
import { member } from '$lib/schema/drizzle';

export async function getOrganizationMember({
	tx,
	args
}: {
	tx: ServerTransaction;
	args: { organizationId: string; userId: string };
}) {
	const memberRecord = await tx.dbTransaction.wrappedTransaction.query.member.findFirst({
		where: and(eq(member.organizationId, args.organizationId), eq(member.userId, args.userId))
	});
	if (!memberRecord) {
		throw new Error('Member not found');
	}
	return memberRecord;
}
