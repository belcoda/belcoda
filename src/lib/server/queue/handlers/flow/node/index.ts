import { db } from '$lib/server/db';
import { type Flow, type Node } from '$lib/schema/flow/node/index';
import { _getFlowDetailsUnsafe } from '$lib/server/api/data/flow/utils';
import { _createFlowExecutionStep } from '$lib/server/api/data/flow/execution_step';
import { failFlowExecution } from '$lib/server/utils/flows/execution';
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
	// The whole setup + dispatch is wrapped so that a failure anywhere — resolving flow details,
	// creating the step record, or the handler itself — marks the execution failed via one path.
	// We do NOT queue the next node (that only happens inside a handler's own success path, so
	// throwing already prevents it) and do NOT rethrow: the execution is terminal-failed rather
	// than retried by the queue.
	let flowExecutionStepId: string | undefined;
	try {
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
		flowExecutionStepId = flowExecutionStep.id;

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
			case 'whatsapp.sendMessage': {
				break;
			}
			default: {
				throw new Error(`Unknown node type: ${node.data.type}`);
			}
		}
	} catch (error) {
		await db.transaction(async (tx) => {
			return await failFlowExecution({ tx, flowExecutionId, flowExecutionStepId, error });
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
}): Node | null {
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
		const targetNode = flow.nodes.find((node) => node.id === edge.target);
		if (!targetNode) {
			throw new Error(`Target node not found: ${edge.target}`);
		}
		return targetNode;
	} else {
		const nextNodeSource = flow.edges.find((edge) => edge.source === node.id);
		if (!nextNodeSource) {
			return null;
		}
		const targetNode = flow.nodes.find((node) => node.id === nextNodeSource.target);
		if (!targetNode) {
			throw new Error(`Target node not found: ${nextNodeSource.target}`);
		}
		return targetNode;
	}
}
