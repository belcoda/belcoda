//node processing imports
import { db } from '$lib/server/db';
import { type NodeHandlerProps } from '$lib/server/queue/handlers/flow/node/index';
import { _getFlowDetailsUnsafe } from '$lib/server/api/data/flow/utils';
import { _updateFlowExecutionStep } from '$lib/server/api/data/flow/execution_step';
import { queueNextNode } from '$lib/server/queue/handlers/flow/node/utils/queue_next_node';
import { shouldSkipPersonMessage } from '$lib/server/queue/handlers/whatsapp/process_flow_node';
import pino from '$lib/pino';

// imports for specific handler action
import { sendWhatsappMessage } from '$lib/server/utils/whatsapp/linkeddevice/send_message';
import { v7 as uuidv7 } from 'uuid';

const log = pino(import.meta.url);

export async function processFlowNodeWhatsappSendMessage({
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
	if (flowDetails.node.data.type !== 'whatsapp.sendMessage') {
		throw new Error(`Node is not an whatsapp send message node for flow version ${flowVersionId}`);
	}
	// This node is reached via automation (cron, person-created, etc.), so enforce subscription
	// as well as doNotContact — mirroring the guard on the WhatsApp flow path so opted-out
	// recipients never receive an automated message.
	if (await shouldSkipPersonMessage({ personId, organizationId, enforceSubscription: true })) {
		log.info(
			{ flowVersionId, flowExecutionId, nodeId, personId, organizationId },
			'Skipped linked-device WhatsApp message for ineligible person'
		);
		await db.transaction(async (tx) => {
			await _updateFlowExecutionStep({
				tx,
				flowExecutionStepId,
				status: 'completed'
			});
		});
		return;
	}
	const message = {
		id: uuidv7(),
		emojiReactions: [],
		...flowDetails.node.data.message
	};
	const whatsappAccountId = flowDetails.node.data.whatsappAccountId;
	const timeoutMs = getRandomTimeoutMs(1500, 30000);
	await sendWhatsappMessage({
		message,
		personId,
		organizationId,
		nodeId,
		whatsappAccountId,
		timeoutMs
	});
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

function getRandomTimeoutMs(min: number, max: number) {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}
