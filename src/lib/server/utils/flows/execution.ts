import type { ServerTransaction } from '@rocicorp/zero';
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
	tx,
	error
}: {
	flowExecutionId: string;
	flowExecutionStepId?: string;
	tx: ServerTransaction;
	error: unknown;
}): Promise<void> {
	const errorMessage = error instanceof Error ? error.message : 'Unknown error';
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
		// persist the reason on the execution too, so step-less failures remain diagnosable
		error: { message: errorMessage },
		completedAt: new Date()
	});
	log.error({ error, flowExecutionId, flowExecutionStepId }, 'Flow execution failed');
}
