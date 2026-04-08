import type { Node, Edge } from '@xyflow/svelte';
import { v4 as uuidv4 } from 'uuid';
import { findPositionRadial } from '../placeNode';
import { flowSchema, type Flow, type NodeType } from '$lib/schema/flow/index';
export function startingNodes({
	defaultTemplateId
}: {
	defaultTemplateId: string | null | undefined;
}): Flow {
	const targetingNodeId = uuidv4();
	const messageNodeId = uuidv4();
	const nodes: Flow['nodes'] = [
		{
			id: targetingNodeId,
			type: 'targeting' as const,
			position: { x: 0, y: 0 },
			data: { filter: { type: 'and', filters: [], exclude: [] } }
		}
	];
	const position = findPositionRadial(
		0,
		0,
		120,
		80,
		nodes.map((node) => {
			return {
				position: node.position,
				width: node.width || 260,
				height: node.height || 100
			};
		})
	) || { x: 0, y: 0 };
	if (defaultTemplateId) {
		nodes.push({
			id: messageNodeId,
			type: 'templateMessage' as const,
			position: position,
			data: { templateId: defaultTemplateId }
		});
	}
	const edges = [
		{
			id: uuidv4(),
			source: targetingNodeId,
			target: messageNodeId,
			type: 'edge' as const
		}
	];
	return { nodes, edges };
}
export function addNode(nodeType: NodeType, parentNode: Node, nodes: Node[]) {
	const position = findPositionRadial(
		parentNode.position.x,
		parentNode.position.y,
		400,
		100,
		nodes.map((node) => ({
			position: node.position,
			width: node.width || 260,
			height: node.height || 100
		}))
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
		case 'teamAdd':
			return {
				id: uuidv4(),
				type: 'teamAdd' as const,
				position: position,
				data: { teamId: '' }
			};
		default:
			return null;
	}
}
