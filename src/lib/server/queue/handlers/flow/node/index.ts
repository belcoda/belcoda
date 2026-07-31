import { db } from '$lib/server/db';
import { createFlowDefinitionChecksum } from '$lib/server/api/data/flows/document.js';
import { _getFlowVersionUnsafe } from '$lib/server/api/data/flows/version';
import { _getFlowExecutionUnsafe } from '$lib/server/api/data/flows/execution';
import {
	_createFlowExecutionStep,
	_updateFlowExecutionStep
} from '$lib/server/api/data/flows/execution_step';
export async function processFlowNode({
	flowVersionId,
	personId,
	organizationId,
	flowExecutionId,
	nodeId
}: {
	flowVersionId: string;
	personId: string;
	organizationId: string;
	flowExecutionId: string;
	nodeId: string;
}): Promise<void> {
	const [flowVersion, flowExecution] = await db.transaction(async (tx) => {
		const [flowVersion, flowExecution] = await Promise.all([
			_getFlowVersionUnsafe({
				tx,
				organizationId,
				flowVersionId
			}),
			_getFlowExecutionUnsafe({
				tx,
				organizationId,
				personId,
				flowExecutionId
			})
		]);
		return [flowVersion, flowExecution];
	});
	const node = flowVersion.flowDefinition.nodes.find((node) => node.id === nodeId);
	if (flowVersion.checksum !== createFlowDefinitionChecksum(flowVersion.flowDefinition)) {
		throw new Error(
			`Flow version ${flowVersion.id} has a different checksum than the flow definition`
		);
	}
	if (!node) {
		throw new Error(
			`Node ${nodeId} not found in flow ${flowVersion.flowDefinition} for execution ${flowExecution.id}`
		);
	}
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
