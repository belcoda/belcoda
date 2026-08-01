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
