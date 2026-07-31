import { flowExecution } from '$lib/schema/drizzle';
import type { ServerTransaction } from '@rocicorp/zero';
import { eq, or, isNull, lte, sql, and } from 'drizzle-orm';

export async function _getFlowExecutionUnsafe({
	tx,
	organizationId,
	personId,
	flowExecutionId
}: {
	tx: ServerTransaction;
	organizationId: string;
	personId: string;
	flowExecutionId: string;
}): Promise<typeof flowExecution.$inferSelect> {
	const result = await tx.dbTransaction.wrappedTransaction.query.flowExecution.findFirst({
		where: and(
			eq(flowExecution.organizationId, organizationId),
			eq(flowExecution.id, flowExecutionId),
			eq(flowExecution.personId, personId)
		)
	});
	if (!result) {
		throw new Error(`Flow execution ${flowExecutionId} not found`);
	}
	return result;
}
