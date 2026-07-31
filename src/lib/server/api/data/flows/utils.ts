import { db } from '$lib/server/db';
import { _getFlowExecutionUnsafe } from '$lib/server/api/data/flows/execution';
import { _getFlowExecutionStepUnsafe } from '$lib/server/api/data/flows/execution_step';
import { _getFlowVersionUnsafe } from '$lib/server/api/data/flows/version';
import { _getPersonByIdUnsafe } from '$lib/server/api/data/person/person';
import { createFlowDefinitionChecksum } from '$lib/server/api/data/flows/document';
export async function _getFlowDetailsUnsafe({
	flowExecutionId,
	personId,
	nodeId,
	organizationId,
	flowVersionId
}: {
	flowExecutionId: string;
	personId: string;
	nodeId: string;
	organizationId: string;
	flowVersionId: string;
}) {
	const result = await db.transaction(async (tx) => {
		const [flowExecution, flowVersion, person] = await Promise.all([
			_getFlowExecutionUnsafe({ tx, personId, flowExecutionId, organizationId }),
			_getFlowVersionUnsafe({ tx, organizationId, flowVersionId }),
			_getPersonByIdUnsafe({ tx, personId, organizationId })
		]);
		return {
			flowExecution,
			flowVersion,
			person
		};
	});
	const node = result.flowVersion.flowDefinition.nodes.find((node) => node.id === nodeId);
	if (!node) {
		throw new Error(`Node ${nodeId} not found`);
	}
	if (
		result.flowVersion.checksum !== createFlowDefinitionChecksum(result.flowVersion.flowDefinition)
	) {
		throw new Error(
			`Flow version ${result.flowVersion.id} has a different checksum than the flow definition`
		);
	}
	if (!node) {
		throw new Error(
			`Node ${nodeId} not found in flow ${result.flowVersion.flowDefinition} for execution ${result.flowExecution.id}`
		);
	}
	return {
		flowExecution: result.flowExecution,
		flowVersion: result.flowVersion,
		person: result.person,
		node
	};
}
