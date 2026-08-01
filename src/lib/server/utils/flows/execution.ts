import { db } from '$lib/server/db';
import { _updateFlowExecutionUnsafe } from '$lib/server/api/data/flow/execution';
import { _updateFlowExecutionStep } from '$lib/server/api/data/flow/execution_step';
import pino from '$lib/pino';
const log = pino(import.meta.url);

// Central place to fail a flow execution. Marks the execution as failed (preserving the error
// message) and, if a step is in flight, marks that step failed too, then logs. Keeping this in one
// place means future behaviour — emailing the owning user, emitting a notification, etc. — can be
// added here rather than scattered across node handlers.
export async function failFlowExecution({
	flowExecutionId,
	flowExecutionStepId,
	error
}: {
	flowExecutionId: string;
	flowExecutionStepId?: string;
	error: unknown;
}): Promise<void> {
	const errorMessage = error instanceof Error ? error.message : 'Unknown error';
	await db.transaction(async (tx) => {
		if (flowExecutionStepId) {
			await _updateFlowExecutionStep({
				tx,
				flowExecutionStepId,
				status: 'failed',
				error: { message: errorMessage }
			});
		}
		await _updateFlowExecutionUnsafe({
			tx,
			flowExecutionId,
			status: 'failed',
			completedAt: new Date()
		});
	});
	log.error({ error, flowExecutionId, flowExecutionStepId }, 'Flow execution failed');
}
