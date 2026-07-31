import { db } from '$lib/server/db';
import { flowDocument, flowTriggerRegistration, flowVersion } from '$lib/schema/drizzle';
import { eq } from 'drizzle-orm';
import { processCronTrigger } from '$lib/server/queue/handlers/flow/node/trigger/cron';
import pino from '$lib/pino';
const log = pino(import.meta.url);

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
		// Guard against running a stale registration: only execute if this version is still the
		// document's active version and execution is enabled. Publishing/rollback rebuilds the
		// registrations, but a run already in flight (or a race) could reference a superseded
		// version — skip it rather than execute an outdated flow.
		const document = await tx.dbTransaction.wrappedTransaction.query.flowDocument.findFirst({
			where: eq(flowDocument.id, version.flowDocumentId)
		});
		if (!document) {
			throw new Error(`Flow document not found for id: ${version.flowDocumentId}`);
		}
		if (document.activeVersionId !== version.id || !document.executionEnabled) {
			return null;
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
	if (!result) {
		log.info(
			{ flowTriggerRegistrationId },
			'Skipping flow trigger registration: version is no longer active or execution is disabled'
		);
		return;
	}
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
