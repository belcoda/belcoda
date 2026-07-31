import { flowVersion } from '$lib/schema/drizzle';
import type { ServerTransaction } from '@rocicorp/zero';
import { eq, or, isNull, lte, sql, and } from 'drizzle-orm';

export async function _getFlowVersionUnsafe({
	tx,
	organizationId,
	flowVersionId
}: {
	tx: ServerTransaction;
	organizationId: string;
	flowVersionId: string;
}): Promise<typeof flowVersion.$inferSelect> {
	const result = await tx.dbTransaction.wrappedTransaction.query.flowVersion.findFirst({
		where: and(eq(flowVersion.organizationId, organizationId), eq(flowVersion.id, flowVersionId))
	});
	if (!result) {
		throw new Error(`Flow version ${flowVersionId} not found`);
	}
	return result;
}
