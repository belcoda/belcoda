import { db } from '$lib/server/db';
import { type Flow } from '$lib/schema/flow/node/index';
import { _getFlowDetailsUnsafe } from '$lib/server/api/data/flow/utils';
import {
	_createFlowExecutionStep,
	_updateFlowExecutionStep
} from '$lib/server/api/data/flow/execution_step';
import { processFlowNodeEventSignup } from '$lib/server/queue/handlers/flow/node/event.signup';
import { processFlowNodeTriggerCron } from '$lib/server/queue/handlers/flow/node/trigger.js';

export type ProcessFlowNodeProps = {
	flowVersionId: string;
	personId: string;
	organizationId: string;
	flowExecutionId: string;
	nodeId: string;
};

export type NodeHandlerProps = ProcessFlowNodeProps & {
	flowExecutionStepId: string;
};
export async function processFlowNode({
	flowVersionId,
	personId,
	organizationId,
	flowExecutionId,
	nodeId
}: ProcessFlowNodeProps): Promise<void> {
	const { node } = await _getFlowDetailsUnsafe({
		flowExecutionId,
		personId,
		nodeId,
		organizationId,
		flowVersionId
	});

	//1 create an step execution record in the database
	const flowExecutionStep = await db.transaction(async (tx) => {
		return await _createFlowExecutionStep({
			tx,
			flowExecutionId,
			nodeId,
			status: 'pending',
			attemptNumber: 1
		});
	});

	try {
		// the bulk of the logic of the handlers should sit in here...
		switch (node.data.type) {
			case 'trigger': {
				await processFlowNodeTriggerCron({
					flowVersionId,
					personId,
					organizationId,
					flowExecutionId,
					flowExecutionStepId: flowExecutionStep.id,
					nodeId
				});
				break;
			}
			case 'event.signup': {
				await processFlowNodeEventSignup({
					flowVersionId,
					personId,
					organizationId,
					flowExecutionId,
					flowExecutionStepId: flowExecutionStep.id,
					nodeId
				});
				break;
			}
			default: {
				throw new Error(`Unknown node type: ${node.data.type}`);
			}
		}
	} catch (error) {
		let errorMessage = '';
		if (error instanceof Error) {
			errorMessage = error.message;
		}
		await db.transaction(async (tx) => {
			await _updateFlowExecutionStep({
				tx,
				flowExecutionStepId: flowExecutionStep.id,
				status: 'failed',
				error: { message: errorMessage }
			});
		});
	}
}

// optional handleId is for nodes with multiple handles and multiple outgoing edges
export function getNextNodeToProcess({
	nodeId,
	handleId,
	flow
}: {
	nodeId: string;
	handleId?: string;
	flow: Flow;
}): string | null {
	const node = flow.nodes.find((node) => node.id === nodeId);
	if (!node) {
		throw new Error(`Node not found: ${nodeId}`);
	}
	if (handleId) {
		const edge = flow.edges.find(
			(edge) => edge.source === node.id && edge.sourceHandle === handleId
		);
		if (!edge) {
			return null;
		}
		return edge.target;
	} else {
		const nextNodeSource = flow.edges.find((edge) => edge.source === node.id);
		if (!nextNodeSource) {
			return null;
		}
		return nextNodeSource.target;
	}
}
