import { flowExecution } from '$lib/schema/drizzle';
import type { ServerTransaction } from '@rocicorp/zero';
import { eq, or, isNull, lte, sql, and } from 'drizzle-orm';
import type { FlowExecutionStatus } from '$lib/schema/flow';
import { v7 as uuidv7 } from 'uuid';
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

export async function _createFlowExecutionUnsafe({
	tx,
	flowExecutionId, //newly created flow execution id
	organizationId,
	personId,
	flowDocumentId,
	flowVersionId,
	triggerNodeId,
	sourceReferenceId,
	status = 'running'
}: {
	tx: ServerTransaction;
	organizationId: string;
	personId: string;
	flowExecutionId: string;
	flowVersionId: string;
	flowDocumentId: string;
	triggerNodeId: string;
	sourceReferenceId?: string;
	status?: FlowExecutionStatus;
}) {
	const insertData: typeof flowExecution.$inferInsert = {
		id: flowExecutionId,
		organizationId,
		flowDocumentId,
		personId,
		flowVersionId,
		triggerNodeId,
		sourceReferenceId,
		idempotencyKey: `${organizationId}-${personId}-${flowVersionId}`, //Do we maybe want to think about what happens if triggering the same workflow multiple times is desired?
		status,
		input: {},
		error: {},
		createdAt: new Date(),
		startedAt: new Date(),
		completedAt: null
	};
	const [result] = await tx.dbTransaction.wrappedTransaction
		.insert(flowExecution)
		.values(insertData)
		.returning();
	if (!result) {
		throw new Error(`Failed to create flow execution for id: ${flowExecutionId}`);
	}
	return result;
}
