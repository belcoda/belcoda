import { getQueue, queueSendOptionsFromTransaction } from '$lib/server/queue';
import { type ServerTransaction } from '@rocicorp/zero';
import { type Flow } from '$lib/schema/flow/node/index';
import { getNextNodeToProcess } from '$lib/server/queue/handlers/flow/node/index';
import { _updateFlowExecutionUnsafe } from '$lib/server/api/data/flow/execution';
export async function queueNextNode({
	flowVersionId,
	personId,
	organizationId,
	flowExecutionId,
	nodeId,
	flow,
	tx
}: {
	flowVersionId: string;
	personId: string;
	organizationId: string;
	flowExecutionId: string;
	nodeId: string;
	flow: Flow;
	tx: ServerTransaction;
}) {
	const nextNodeToProcess = getNextNodeToProcess({
		nodeId,
		flow
	});
	if (nextNodeToProcess?.id) {
		// if it's sending a whatsapp message, set a group id to make sure only one message from the same account is sent at a time
		const options =
			nextNodeToProcess.data.type === 'whatsapp.sendMessage'
				? {
						...queueSendOptionsFromTransaction(tx),
						group: {
							id: `account_${nextNodeToProcess.data.whatsappAccountId}`
						}
					}
				: queueSendOptionsFromTransaction(tx);
		//queue the next node to process
		const queue = await getQueue();
		await queue.processFlowNode(
			{
				flowVersionId,
				personId,
				organizationId,
				flowExecutionId,
				nodeId: nextNodeToProcess.id
			},
			options
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
}
