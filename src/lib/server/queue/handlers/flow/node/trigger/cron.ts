import type { Flow } from '$lib/schema/flow/node';
import { getPersonIdsFromFilter } from '$lib/server/utils/person/filter';
import { getApiQueryContext } from '$lib/server/api/utils/auth/permissions';
import { getQueue } from '$lib/server/queue';
import { _createFlowExecutionUnsafe } from '$lib/server/api/data/flow/execution';
import type { ServerTransaction } from '@rocicorp/zero';
import { v7 as uuidv7 } from 'uuid';
import { queueSendOptionsFromTransaction } from '$lib/server/queue';
import { db } from '$lib/server/db';
import pino from '$lib/pino';
const log = pino(import.meta.url);
//function to process a cron trigger node... creates an execution record for each person in the target filter and queues the node processing job for each person
export async function processCronTrigger({
	nodeId,
	flowDefinition,
	flowVersionId,
	flowDocumentId,
	organizationId
}: {
	nodeId: string;
	flowDefinition: Flow;
	flowVersionId: string;
	flowDocumentId: string;
	organizationId: string;
}) {
	const cronTrigger = flowDefinition.nodes.find((node) => node.id === nodeId);
	if (!cronTrigger) {
		throw new Error(`Cron trigger not found for id: ${nodeId}`);
	}
	if (cronTrigger.data.type !== 'trigger') {
		throw new Error(`Cron trigger is not a trigger for id: ${nodeId}`);
	}
	if (!cronTrigger.data.trigger) {
		throw new Error(`Cron trigger is not a valid trigger for id: ${nodeId}`);
	}
	if (cronTrigger.data.trigger.type !== 'utils.cron') {
		throw new Error(`Cron trigger is not a cron trigger for id: ${nodeId}`);
	}

	const ctx = getApiQueryContext(organizationId);
	const personIds = await getPersonIdsFromFilter({
		ctx,
		organizationId,
		filter: cronTrigger.data.trigger.targets
	});
	const queue = await getQueue();
	for (const personId of personIds) {
		// Isolate each person: a single person's failure (e.g. an idempotencyKey collision from a
		// duplicate fire) is logged and skipped so the remaining people in the target filter still
		// get processed, rather than one failure aborting the whole cron run.
		try {
			await db.transaction(async (tx) => {
				const promises = createExecutionContextAndTriggerJob({
					nodeId,
					flowVersionId,
					organizationId,
					personId,
					flowDocumentId,
					queue,
					tx
				});
				await Promise.all(promises);
			});
		} catch (error) {
			log.error(
				{ error, personId, nodeId, flowVersionId, flowDocumentId, organizationId },
				'Failed to create flow execution for person in cron trigger'
			);
		}
	}
}

function createExecutionContextAndTriggerJob({
	nodeId,
	flowVersionId,
	organizationId,
	personId,
	flowDocumentId,
	queue,
	tx
}: {
	nodeId: string;
	flowVersionId: string;
	organizationId: string;
	personId: string;
	flowDocumentId: string;
	queue: Awaited<ReturnType<typeof getQueue>>;
	tx: ServerTransaction;
}) {
	// create an execution record for the job
	const flowExecutionId = uuidv7();
	return [
		_createFlowExecutionUnsafe({
			tx,
			flowExecutionId,
			organizationId,
			personId,
			flowVersionId,
			flowDocumentId,
			triggerNodeId: nodeId
		}),
		queue.processFlowNode(
			{
				flowVersionId,
				personId,
				organizationId,
				flowExecutionId,
				nodeId
			},
			queueSendOptionsFromTransaction(tx)
		)
	];
}
