import { type FlowNode } from '../types';
import type { Node, Edge } from '@xyflow/svelte';
import { v4 as uuidv4 } from 'uuid';
import { findPositionRadial } from '../placeNode';
export function startingNodes(): { nodes: FlowNode[]; edges: Edge[] } {
	const targetingNodeId = uuidv4();
	const messageNodeId = uuidv4();
	const nodes: FlowNode[] = [
		{
			id: targetingNodeId,
			type: 'targeting' as const,
			position: { x: 0, y: 0 },
			data: { recipients: [] }
		}
	];
	const position = findPositionRadial(0, 0, 120, 80, nodes) || { x: 0, y: 0 };
	nodes.push({
		id: messageNodeId,
		type: 'message' as const,
		position: position,
		data: { text: 'Your message here', buttons: [], imageUrl: null }
	});
	const edges = [
		{
			id: uuidv4(),
			source: targetingNodeId,
			target: messageNodeId,
			type: 'test-edge' as const
		}
	];
	return { nodes, edges };
}

type NodeType = 'message' | 'eventSignup' | 'tagAdd';
export function addNode(nodeType: NodeType, parentNode: FlowNode, nodes: FlowNode[]) {
	const position = findPositionRadial(
		parentNode.position.x,
		parentNode.position.y,
		400,
		100,
		nodes
	) || { x: 0, y: 0 };
	switch (nodeType) {
		case 'message':
			return {
				id: uuidv4(),
				type: 'message' as const,
				position: position,
				data: { text: 'Your message here', buttons: [], imageUrl: null }
			};
		case 'eventSignup':
			return {
				id: uuidv4(),
				type: 'eventSignup' as const,
				position: position,
				data: { eventId: '' }
			};
		case 'tagAdd':
			return {
				id: uuidv4(),
				type: 'tagAdd' as const,
				position: position,
				data: { tagId: '' }
			};
		default:
			return null;
	}
}
