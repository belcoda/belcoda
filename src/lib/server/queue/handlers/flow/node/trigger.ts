//node processing imports
import { db } from '$lib/server/db';
import { getQueue } from '$lib/server/queue/index';
import {
	type NodeHandlerProps,
	getNextNodeToProcess
} from '$lib/server/queue/handlers/flow/node/index';
import { _getFlowDetailsUnsafe } from '$lib/server/api/data/flow/utils';
import { _updateFlowExecutionStep } from '$lib/server/api/data/flow/execution_step';

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
	await db.transaction(async (tx) => {
		await _updateFlowExecutionStep({
			tx,
			flowExecutionStepId,
			status: 'completed'
		});
	});

	//finally, queue the next node to process if it exists
	const nextNodeToProcess = getNextNodeToProcess({
		nodeId,
		flow: flowDetails.flowVersion.flowDefinition
	});

	if (nextNodeToProcess) {
		//queue the next node to process
		const queue = await getQueue();
		await queue.processFlowNode({
			flowVersionId,
			personId,
			organizationId,
			flowExecutionId,
			nodeId: nextNodeToProcess
		});
	}
}
