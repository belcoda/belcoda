//node processing imports
import { db } from '$lib/server/db';
import { getQueue, queueSendOptionsFromTransaction } from '$lib/server/queue/index';
import {
	type NodeHandlerProps,
	getNextNodeToProcess
} from '$lib/server/queue/handlers/flow/node/index';
import { _getFlowDetailsUnsafe } from '$lib/server/api/data/flow/utils';
import { _updateFlowExecutionStep } from '$lib/server/api/data/flow/execution_step';
import { _updateFlowExecutionUnsafe } from '$lib/server/api/data/flow/execution';

// imports for specific handler action

export async function processFlowNodeTriggerCron({
	flowVersionId,
	personId,
	organizationId,
	flowExecutionId,
	flowExecutionStepId,
	nodeId
}: NodeHandlerProps): Promise<void> {
	const flowDetails = await _getFlowDetailsUnsafe({
		flowVersionId,
		personId,
		organizationId,
		flowExecutionId,
		nodeId
	});
	if (flowDetails.node.data.type !== 'trigger') {
		throw new Error(`Node is not a trigger node for flow version ${flowVersionId}`);
	}
	switch (flowDetails.node.data.trigger.type) {
		case 'utils.cron':
			// don't actually need to do anything here, the trigger node is a noop... we just need to update the flow execution step and find the next node
			break;
		default:
			throw new Error(`Unknown trigger type: ${flowDetails.node.data.trigger.type}`);
	}
	// finally, complete the step and either queue the next node or, if this is a terminal node,
	// mark the whole execution completed — all in one transaction so the step/execution state and
	// the next-node enqueue commit atomically.
	await db.transaction(async (tx) => {
		await _updateFlowExecutionStep({
			tx,
			flowExecutionStepId,
			status: 'completed'
		});

		const nextNodeToProcess = getNextNodeToProcess({
			nodeId,
			flow: flowDetails.flowVersion.flowDefinition
		});

		if (nextNodeToProcess) {
			//queue the next node to process
			const queue = await getQueue();
			await queue.processFlowNode(
				{
					flowVersionId,
					personId,
					organizationId,
					flowExecutionId,
					nodeId: nextNodeToProcess
				},
				queueSendOptionsFromTransaction(tx)
			);
		} else {
			// Terminal node (no outgoing edge): the flow is finished, so mark the execution completed.
			// Without this the execution would stay 'running' forever.
			await _updateFlowExecutionUnsafe({
				tx,
				flowExecutionId,
				status: 'completed',
				completedAt: new Date()
			});
		}
	});
}
