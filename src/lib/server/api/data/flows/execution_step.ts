import { flowExecutionStep } from '$lib/schema/drizzle';
import {
	flowExecutionStepStatus,
	type FlowExecutionStepStatus,
	type FlowExecutionStepError
} from '$lib/schema/flow';
import type { ServerTransaction } from '@rocicorp/zero';
import { eq, or, isNull, lte, sql, and } from 'drizzle-orm';
import { v7 as uuidv7 } from 'uuid';
export async function _getFlowExecutionStepUnsafe({
	tx,
	flowExecutionStepId,
	flowExecutionId
}: {
	tx: ServerTransaction;
	flowExecutionStepId: string;
	flowExecutionId: string;
}): Promise<typeof flowExecutionStep.$inferSelect> {
	const result = await tx.dbTransaction.wrappedTransaction.query.flowExecutionStep.findFirst({
		where: and(
			eq(flowExecutionStep.flowExecutionId, flowExecutionId),
			eq(flowExecutionStep.id, flowExecutionStepId)
		)
	});
	if (!result) {
		throw new Error(`Flow execution step ${flowExecutionStepId} not found`);
	}
	return result;
}

export async function _createFlowExecutionStep({
	tx,
	flowExecutionId,
	invocationId,
	nodeId,
	status,
	scheduledAt,
	attemptNumber = 1
}: {
	tx: ServerTransaction;
	flowExecutionId: string;
	nodeId: string;
	invocationId?: string;
	status: FlowExecutionStepStatus;
	scheduledAt?: Date;
	attemptNumber?: number;
}): Promise<typeof flowExecutionStep.$inferSelect> {
	const flowExecutionStepToInsert: typeof flowExecutionStep.$inferInsert = {
		id: uuidv7(),
		flowExecutionId,
		invocationId: invocationId ?? uuidv7(),
		nodeId,
		attemptNumber,
		output: {},
		input: {},
		error: {},
		status,
		createdAt: new Date(),
		updatedAt: new Date(),
		scheduledAt: scheduledAt ?? null
	};
	const result = await tx.dbTransaction.wrappedTransaction
		.insert(flowExecutionStep)
		.values(flowExecutionStepToInsert)
		.returning();
	if (!result[0]) {
		throw new Error('Failed to create flow execution step');
	}
	return result[0];
}

export async function _updateFlowExecutionStep({
	tx,
	flowExecutionStepId,
	status,
	error
}: {
	tx: ServerTransaction;
	flowExecutionStepId: string;
	status: FlowExecutionStepStatus;
	error?: FlowExecutionStepError;
}): Promise<typeof flowExecutionStep.$inferSelect> {
	const result = await tx.dbTransaction.wrappedTransaction
		.update(flowExecutionStep)
		.set({
			status,
			error: error ?? {},
			updatedAt: new Date()
		})
		.where(eq(flowExecutionStep.id, flowExecutionStepId))
		.returning();
	if (!result[0]) {
		throw new Error('Failed to update flow execution step');
	}
	return result[0];
}
