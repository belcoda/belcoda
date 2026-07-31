import { db } from '$lib/server/db';
import { flowTriggerRegistration, flowVersion } from '$lib/schema/drizzle';
import { eq } from 'drizzle-orm';
import { processCronTrigger } from '$lib/server/queue/handlers/flow/node/trigger/cron';

//function to manage any trigger node processing... processes the trigger node inline
export async function processFlowNodeTrigger({
	flowTriggerRegistrationId
}: {
	flowTriggerRegistrationId: string;
}) {
	const result = await db.transaction(async (tx) => {
		const flowTriggerRegistrationRecord =
			await tx.dbTransaction.wrappedTransaction.query.flowTriggerRegistration.findFirst({
				where: eq(flowTriggerRegistration.id, flowTriggerRegistrationId)
			});
		if (!flowTriggerRegistrationRecord) {
			throw new Error(
				`Flow trigger registration record not found for id: ${flowTriggerRegistrationId}`
			);
		}
		const version = await tx.dbTransaction.wrappedTransaction.query.flowVersion.findFirst({
			where: eq(flowVersion.id, flowTriggerRegistrationRecord.flowVersionId)
		});
		if (!version) {
			throw new Error(
				`Flow version not found for id: ${flowTriggerRegistrationRecord.flowVersionId}`
			);
		}
		const triggerNode = version.flowDefinition.nodes.find(
			(node) => node.id === flowTriggerRegistrationRecord.triggerNodeId
		);
		if (!triggerNode) {
			throw new Error(
				`Trigger node not found for id: ${flowTriggerRegistrationRecord.triggerNodeId}`
			);
		}
		return {
			triggerType: flowTriggerRegistrationRecord.triggerType,
			triggerNodeId: triggerNode.id,
			flowDefinition: version.flowDefinition,
			flowVersionId: version.id,
			flowDocumentId: version.flowDocumentId,
			organizationId: version.organizationId
		};
	});
	switch (result.triggerType) {
		case 'cron':
			await processCronTrigger({
				nodeId: result.triggerNodeId,
				flowDocumentId: result.flowDocumentId,
				flowDefinition: result.flowDefinition,
				flowVersionId: result.flowVersionId,
				organizationId: result.organizationId
			});
			break;
		default:
			throw new Error(`Unknown trigger type: ${result.triggerType}`);
	}
}
