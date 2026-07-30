import { type Flow } from '$lib/schema/flow/node/index.js';
import {
	person as personTable,
	flowExecution as flowExecutionTable,
	flowVersion as flowVersionTable
} from '$lib/schema/drizzle.js';
export async function processFlowNode({
	flowVersion,
	person,
	flowExecution,
	nodeId
}: {
	flowVersion: typeof flowVersionTable.$inferSelect;
	person: typeof personTable.$inferSelect;
	flowExecution: typeof flowExecutionTable.$inferSelect;
	nodeId: string;
}): Promise<void> {
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

	switch (node.data.type) {
		default:
	}
}
