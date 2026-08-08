//node processing imports
import { db } from '$lib/server/db';
import { type NodeHandlerProps } from '$lib/server/queue/handlers/flow/node/index';
import { _getFlowDetailsUnsafe } from '$lib/server/api/data/flow/utils';
import { _updateFlowExecutionStep } from '$lib/server/api/data/flow/execution_step';
import { queueNextNode } from '$lib/server/queue/handlers/flow/node/utils/queue_next_node';
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

		await queueNextNode({
			flowVersionId,
			personId,
			organizationId,
			flowExecutionId,
			nodeId,
			flow: flowDetails.flowVersion.flowDefinition,
			tx
		});
	});
}
