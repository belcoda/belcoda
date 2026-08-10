import { flowExecution } from '$lib/schema/drizzle';
import type { ServerTransaction } from '@rocicorp/zero';
import { eq, and } from 'drizzle-orm';
import type { FlowExecutionStatus, FlowExecutionError } from '$lib/schema/flow';
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
	const now = new Date();
	// The idempotency key is bucketed to minute resolution (seconds/ms zeroed). This is a
	// deliberate compromise: two executions for the same org + person + flow version + trigger node
	// fired within the same minute collide on the unique idempotencyKey, so the second insert throws
	// — which safely dedupes accidental double-fires. Legitimate re-triggers more than a minute
	// apart get distinct keys and succeed. triggerNodeId is included so two distinct trigger nodes
	// firing for the same person in the same minute don't collide. Revisit if intentional
	// sub-minute re-triggering of the same flow for the same person is ever needed.
	const minuteBucket = new Date(now);
	minuteBucket.setSeconds(0, 0);
	const insertData: typeof flowExecution.$inferInsert = {
		id: flowExecutionId,
		organizationId,
		flowDocumentId,
		personId,
		flowVersionId,
		triggerNodeId,
		sourceReferenceId,
		idempotencyKey: `${organizationId}-${personId}-${flowVersionId}-${triggerNodeId}-${minuteBucket.toISOString()}`,
		status,
		input: {},
		error: {},
		createdAt: now,
		startedAt: now,
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

export async function _updateFlowExecutionUnsafe({
	tx,
	flowExecutionId,
	status,
	error,
	completedAt
}: {
	tx: ServerTransaction;
	flowExecutionId: string;
	status: FlowExecutionStatus;
	error?: FlowExecutionError;
	completedAt?: Date | null;
}): Promise<typeof flowExecution.$inferSelect> {
	const [result] = await tx.dbTransaction.wrappedTransaction
		.update(flowExecution)
		.set({
			status,
			...(error !== undefined ? { error } : {}),
			...(completedAt !== undefined ? { completedAt } : {})
		})
		.where(eq(flowExecution.id, flowExecutionId))
		.returning();
	if (!result) {
		throw new Error(`Failed to update flow execution for id: ${flowExecutionId}`);
	}
	return result;
}
