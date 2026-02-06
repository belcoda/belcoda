import pino from '$lib/pino';
const log = pino(import.meta.url);

import type { WhatsappFlowInternal } from '$lib/schema/whatsapp/flows/schema';
import { deployFlow, updateFlow, publishFlow } from '$lib/server/utils/whatsapp/ycloud/ycloud_api';

export async function deployEventFlow({
	flow,
	wabaId,
	publish = false,
	endpointUri
}: {
	flow: WhatsappFlowInternal;
	wabaId: string;
	publish?: boolean;
	endpointUri?: string;
}): Promise<WhatsappFlowInternal> {
	const hasYCloudId = !!flow.metadata.ycloudFlowId;

	let updatedFlow: WhatsappFlowInternal;

	if (hasYCloudId) {
		// Update existing flow
		log.debug(
			{ ycloudFlowId: flow.metadata.ycloudFlowId, eventId: flow.metadata.sourceEventId },
			'Updating existing flow on YCloud'
		);

		const result = await updateFlow({
			flow,
			wabaId,
			ycloudFlowId: flow.metadata.ycloudFlowId!,
			publish: false, // Always update as DRAFT first
			endpointUri
		});

		updatedFlow = {
			...flow,
			metadata: {
				...flow.metadata,
				ycloudFlowId: result.flowId,
				updatedAt: Date.now()
			}
		};

		// Publish the flow after making updates (if event has been published too)
		if (publish && updatedFlow.metadata.ycloudFlowId) {
			log.debug(
				{
					ycloudFlowId: updatedFlow.metadata.ycloudFlowId,
					eventId: updatedFlow.metadata.sourceEventId
				},
				'Publishing flow on YCloud'
			);

			await publishFlow({
				ycloudFlowId: updatedFlow.metadata.ycloudFlowId
			});

			log.info(
				{
					ycloudFlowId: updatedFlow.metadata.ycloudFlowId,
					eventId: updatedFlow.metadata.sourceEventId
				},
				'Flow published successfully'
			);
		}
	} else {
		// Deploy new flow
		log.debug(
			{ internalId: flow.metadata.id, eventId: flow.metadata.sourceEventId },
			'Deploying new flow to YCloud'
		);

		const result = await deployFlow({
			flow,
			wabaId,
			publish,
			endpointUri
		});

		return {
			...flow,
			metadata: {
				...flow.metadata,
				ycloudFlowId: result.flowId,
				updatedAt: Date.now()
			}
		};
	}

	return updatedFlow;
}
