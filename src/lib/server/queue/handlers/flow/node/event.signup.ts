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
import { signUpForEventWithId } from '$lib/server/api/data/event/signup';

export async function processFlowNodeEventSignup({
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
	if (flowDetails.node.data.type !== 'event.signup') {
		throw new Error(`Node is not an event signup node for flow version ${flowVersionId}`);
	}
	const eventId = flowDetails.node.data.eventId;
	await db.transaction(async (tx) => {
		await signUpForEventWithId({
			eventId,
			personId,
			organizationId,
			tx,
			signupDetails: {
				channel: {
					type: 'whatsapp'
				},
				customFields: {}
			}
		});
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
