// This is a simple handler that will process a node in a SvelteFlow flow

import { type Node, type Edge } from '@xyflow/svelte';

type FlowType =
	| 'eventSignup'
	| 'eventReminder'
	| 'eventFollowup'
	| 'eventCancellation'
	| 'automation';
type FlowReference = {
	type: FlowType;
	referenceId: string;
};

type FlowActivityTable = {
	flowType: FlowType;
	flowReferenceId: string;
	nodeId: string;
	personId: string;
	createdAt: Date;
};

type ProcessNodeProps = {
	flow: { nodes: Node[]; edges: Edge[] };
};

export async function processNode({ nodeId, flowId, flow }: ProcessNodeProps) {
	const node = flow.nodes.find((node) => node.id === nodeId);
	if (!node) {
		throw new Error('Node not found');
	}
}
