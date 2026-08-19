//node processing imports
import { db } from '$lib/server/db';
import { type NodeHandlerProps } from '$lib/server/queue/handlers/flow/node/index';
import { _getFlowDetailsUnsafe } from '$lib/server/api/data/flow/utils';
import { _updateFlowExecutionStep } from '$lib/server/api/data/flow/execution_step';
import { queueNextNode } from '$lib/server/queue/handlers/flow/node/utils/queue_next_node';

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
					// this signup was created by a flow automation, not a direct WhatsApp/page/admin action
					type: 'automationFlow'
				},
				customFields: {}
			}
		});
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
