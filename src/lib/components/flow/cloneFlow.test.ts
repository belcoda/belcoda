import { describe, it, expect } from 'vitest';
import { cloneFlow } from './cloneFlow';
import { defaultFilterGroup } from '$lib/schema/person/filter';
import { structuredClone } from '$lib/utils/structuredClone';
import type { Flow } from '$lib/schema/flow/index';

// Deterministic literal ids so assertions are readable and stable.
const TARGETING_ID = '11111111-1111-4111-8111-111111111111';
const MESSAGE_ID = '22222222-2222-4222-8222-222222222222';
const TEMPLATE_ID = '33333333-3333-4333-8333-333333333333';
const TAGADD_ID = '44444444-4444-4444-8444-444444444444';

const MSG_BUTTON_A = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const MSG_BUTTON_B = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const TPL_BUTTON_A = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';

const TEMPLATE_MESSAGE_TEMPLATE_ID = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';
const TAG_ID = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee';

/**
 * A comprehensive fixture covering every node variant of interest and both
 * plain node->node edges and button-sourced edges (sourceHandle set).
 */
function buildFlow(): Flow {
	return {
		nodes: [
			{
				id: TARGETING_ID,
				type: 'targeting',
				position: { x: 0, y: 0 },
				width: 260,
				height: 100,
				data: {
					filter: {
						type: 'and',
						filters: [{ type: 'everyone', label: 'Everyone' }],
						exclude: []
					}
				}
			},
			{
				id: MESSAGE_ID,
				type: 'message',
				position: { x: 100, y: 200 },
				width: 260,
				height: 120,
				data: {
					text: 'Hello there',
					imageUrl: null,
					buttons: [
						{ id: MSG_BUTTON_A, label: 'Yes' },
						{ id: MSG_BUTTON_B, label: 'No' }
					]
				}
			},
			{
				id: TEMPLATE_ID,
				type: 'templateMessage',
				position: { x: 300, y: 400 },
				data: {
					templateId: TEMPLATE_MESSAGE_TEMPLATE_ID,
					buttons: [{ id: TPL_BUTTON_A }]
				}
			},
			{
				id: TAGADD_ID,
				type: 'tagAdd',
				position: { x: 500, y: 600 },
				data: { tagId: TAG_ID }
			}
		],
		edges: [
			// plain node -> node edge
			{
				id: `xy-edge__${TARGETING_ID}--${MESSAGE_ID}`,
				source: TARGETING_ID,
				target: MESSAGE_ID
			},
			// button-sourced edge (sourceHandle set to a button id)
			{
				id: `xy-edge__${MSG_BUTTON_A}--${TEMPLATE_ID}`,
				source: MESSAGE_ID,
				target: TEMPLATE_ID,
				sourceHandle: MSG_BUTTON_A
			},
			{
				id: `xy-edge__${MSG_BUTTON_B}--${TAGADD_ID}`,
				source: MESSAGE_ID,
				target: TAGADD_ID,
				sourceHandle: MSG_BUTTON_B
			},
			// button-sourced edge originating from a templateMessage button
			{
				id: `xy-edge__${TPL_BUTTON_A}--${TAGADD_ID}`,
				source: TEMPLATE_ID,
				target: TAGADD_ID,
				sourceHandle: TPL_BUTTON_A
			}
		]
	};
}

/** Minimal valid flow mirroring `startingNodes()` shape: one targeting node. */
function targetingOnlyFlow(): Flow {
	return {
		nodes: [
			{
				id: TARGETING_ID,
				type: 'targeting',
				position: { x: 0, y: 0 },
				data: { filter: structuredClone(defaultFilterGroup) }
			}
		],
		edges: []
	};
}

describe('cloneFlow', () => {
	describe('immutability of the original', () => {
		it('does not mutate the input and returns a distinct object graph', () => {
			const original = buildFlow();
			const snapshot = structuredClone(original);

			const clone = cloneFlow(original);

			// Original is byte-for-byte unchanged.
			expect(original).toEqual(snapshot);
			// The clone is a different reference at every level.
			expect(clone).not.toBe(original);
			expect(clone.nodes).not.toBe(original.nodes);
			expect(clone.edges).not.toBe(original.edges);
			clone.nodes.forEach((node, i) => {
				expect(node).not.toBe(original.nodes[i]);
			});
		});
	});

	describe('full id regeneration', () => {
		it('regenerates every node id', () => {
			const original = buildFlow();
			const clone = cloneFlow(original);

			const originalNodeIds = new Set(original.nodes.map((n) => n.id));
			clone.nodes.forEach((n) => {
				expect(originalNodeIds.has(n.id)).toBe(false);
			});
		});

		it('regenerates every button id', () => {
			const original = buildFlow();
			const clone = cloneFlow(original);

			const originalButtonIds = new Set([MSG_BUTTON_A, MSG_BUTTON_B, TPL_BUTTON_A]);
			for (const node of clone.nodes) {
				if (node.type === 'message' || node.type === 'templateMessage') {
					for (const button of node.data.buttons ?? []) {
						expect(originalButtonIds.has(button.id)).toBe(false);
					}
				}
			}
		});

		it('regenerates every edge id', () => {
			const original = buildFlow();
			const clone = cloneFlow(original);

			const originalEdgeIds = new Set(original.edges.map((e) => e.id));
			clone.edges.forEach((e) => {
				expect(originalEdgeIds.has(e.id)).toBe(false);
			});
		});

		it('produces globally unique ids across nodes, buttons and edges', () => {
			const clone = cloneFlow(buildFlow());
			const allIds: string[] = [];
			for (const node of clone.nodes) {
				allIds.push(node.id);
				if (node.type === 'message' || node.type === 'templateMessage') {
					for (const button of node.data.buttons ?? []) allIds.push(button.id);
				}
			}
			for (const edge of clone.edges) allIds.push(edge.id);
			expect(new Set(allIds).size).toBe(allIds.length);
		});
	});

	describe('referential integrity', () => {
		it('keeps every edge source/target pointing at a cloned node id', () => {
			const clone = cloneFlow(buildFlow());
			const clonedNodeIds = new Set(clone.nodes.map((n) => n.id));
			for (const edge of clone.edges) {
				expect(clonedNodeIds.has(edge.source)).toBe(true);
				expect(clonedNodeIds.has(edge.target)).toBe(true);
			}
		});

		it('remaps a templateMessage button-sourced edge to the new template button id', () => {
			const original = buildFlow();
			const clone = cloneFlow(original);

			// Locate the templateMessage node in both flows (order preserved).
			const templateIndex = original.nodes.findIndex((n) => n.type === 'templateMessage');
			const clonedTemplate = clone.nodes[templateIndex];
			if (clonedTemplate.type !== 'templateMessage') throw new Error('expected templateMessage');
			const clonedTplButtonIds = (clonedTemplate.data.buttons ?? []).map((b) => b.id);

			// The edge sourced from the original template button must now point at the
			// cloned template node and one of its regenerated button ids.
			const originalEdgeIndex = original.edges.findIndex(
				(e) => e.source === TEMPLATE_ID && e.sourceHandle === TPL_BUTTON_A
			);
			expect(originalEdgeIndex).toBeGreaterThanOrEqual(0);
			const clonedEdge = clone.edges[originalEdgeIndex];
			expect(clonedEdge.source).toBe(clonedTemplate.id);
			expect(clonedEdge.sourceHandle).toBeDefined();
			expect(clonedTplButtonIds).toContain(clonedEdge.sourceHandle);
			expect(clonedEdge.sourceHandle).not.toBe(TPL_BUTTON_A);
		});

		it('keeps sourceHandle pointing at a button id on the source node', () => {
			const clone = cloneFlow(buildFlow());
			const nodeById = new Map(clone.nodes.map((n) => [n.id, n]));

			for (const edge of clone.edges) {
				if (edge.sourceHandle === undefined) continue;
				const source = nodeById.get(edge.source);
				expect(source).toBeDefined();
				if (source && (source.type === 'message' || source.type === 'templateMessage')) {
					const buttonIds = (source.data.buttons ?? []).map((b) => b.id);
					expect(buttonIds).toContain(edge.sourceHandle);
				}
			}
		});
	});

	describe('topology preservation', () => {
		it('preserves node and edge counts and node types', () => {
			const original = buildFlow();
			const clone = cloneFlow(original);

			expect(clone.nodes).toHaveLength(original.nodes.length);
			expect(clone.edges).toHaveLength(original.edges.length);
			expect(clone.nodes.map((n) => n.type)).toEqual(original.nodes.map((n) => n.type));
		});

		it('preserves the edge topology under the old->new id mapping', () => {
			const original = buildFlow();
			const clone = cloneFlow(original);

			// Reconstruct old->new node id mapping by position (order preserved).
			const nodeMap = new Map<string, string>();
			original.nodes.forEach((n, i) => nodeMap.set(n.id, clone.nodes[i].id));

			original.edges.forEach((oldEdge, i) => {
				const newEdge = clone.edges[i];
				expect(newEdge.source).toBe(nodeMap.get(oldEdge.source));
				expect(newEdge.target).toBe(nodeMap.get(oldEdge.target));
			});
		});

		it('regenerates edge ids following the xy-edge convention', () => {
			const clone = cloneFlow(buildFlow());
			for (const edge of clone.edges) {
				const expectedId = `xy-edge__${edge.sourceHandle ?? edge.source}--${edge.target}`;
				expect(edge.id).toBe(expectedId);
			}
		});
	});

	describe('targeting reset', () => {
		it('resets data.filter to defaultFilterGroup on every targeting node', () => {
			const original = buildFlow();
			const clone = cloneFlow(original);

			const targetingNodes = clone.nodes.filter((n) => n.type === 'targeting');
			expect(targetingNodes.length).toBeGreaterThan(0);
			for (const node of targetingNodes) {
				if (node.type !== 'targeting') continue;
				expect(node.data.filter).toEqual(defaultFilterGroup);
			}
		});
	});

	describe('button handling', () => {
		it('preserves button counts and non-id data, changing only ids', () => {
			const original = buildFlow();
			const clone = cloneFlow(original);

			const originalMessage = original.nodes.find((n) => n.type === 'message');
			const clonedMessage = clone.nodes.find((n) => n.type === 'message');
			expect(originalMessage?.type).toBe('message');
			expect(clonedMessage?.type).toBe('message');
			if (originalMessage?.type !== 'message' || clonedMessage?.type !== 'message') return;

			expect(clonedMessage.data.buttons).toHaveLength(originalMessage.data.buttons?.length ?? 0);
			expect(clonedMessage.data.text).toBe(originalMessage.data.text);
			// Labels preserved, ids changed.
			clonedMessage.data.buttons?.forEach((button, i) => {
				expect(button.label).toBe(originalMessage.data.buttons?.[i].label);
				expect(button.id).not.toBe(originalMessage.data.buttons?.[i].id);
			});
		});

		it('leaves non-button node data untouched', () => {
			const original = buildFlow();
			const clone = cloneFlow(original);

			const originalTag = original.nodes.find((n) => n.type === 'tagAdd');
			const clonedTag = clone.nodes.find((n) => n.type === 'tagAdd');
			if (originalTag?.type !== 'tagAdd' || clonedTag?.type !== 'tagAdd') {
				throw new Error('expected tagAdd node');
			}
			expect(clonedTag.data).toEqual(originalTag.data);
		});
	});

	describe('edge cases', () => {
		it('handles an empty flow', () => {
			const clone = cloneFlow({ nodes: [], edges: [] });
			expect(clone).toEqual({ nodes: [], edges: [] });
		});

		it('handles a message node without buttons', () => {
			// Persisted flows may lack `buttons` entirely; cast to model that runtime shape.
			const flow = {
				nodes: [
					{
						id: MESSAGE_ID,
						type: 'message',
						position: { x: 0, y: 0 },
						data: { text: 'no buttons', imageUrl: null }
					}
				],
				edges: []
			} as unknown as Flow;
			const clone = cloneFlow(flow);
			expect(clone.nodes).toHaveLength(1);
			const node = clone.nodes[0];
			expect(node.id).not.toBe(MESSAGE_ID);
			if (node.type !== 'message') throw new Error('expected message node');
			expect(node.data.buttons ?? []).toHaveLength(0);
		});

		it('handles a flow with only a targeting node (startingNodes shape)', () => {
			const clone = cloneFlow(targetingOnlyFlow());
			expect(clone.nodes).toHaveLength(1);
			expect(clone.edges).toHaveLength(0);
			const node = clone.nodes[0];
			expect(node.id).not.toBe(TARGETING_ID);
			if (node.type !== 'targeting') throw new Error('expected targeting node');
			expect(node.data.filter).toEqual(defaultFilterGroup);
		});

		it('throws when an edge references an unknown target node id', () => {
			const flow: Flow = {
				nodes: [
					{
						id: TARGETING_ID,
						type: 'targeting',
						position: { x: 0, y: 0 },
						data: { filter: structuredClone(defaultFilterGroup) }
					}
				],
				edges: [
					{
						id: 'dangling',
						source: TARGETING_ID,
						target: MESSAGE_ID // not present among nodes
					}
				]
			};
			expect(() => cloneFlow(flow)).toThrow(/unknown target node id/);
		});

		it('throws when an edge references an unknown source node id', () => {
			const flow: Flow = {
				nodes: [
					{
						id: TARGETING_ID,
						type: 'targeting',
						position: { x: 0, y: 0 },
						data: { filter: structuredClone(defaultFilterGroup) }
					}
				],
				edges: [
					{
						id: 'dangling',
						source: MESSAGE_ID, // not present among nodes
						target: TARGETING_ID
					}
				]
			};
			expect(() => cloneFlow(flow)).toThrow(/unknown source node id/);
		});

		it('throws when an edge references an unknown sourceHandle id', () => {
			const flow: Flow = {
				nodes: [
					{
						id: MESSAGE_ID,
						type: 'message',
						position: { x: 0, y: 0 },
						data: { text: 'hi', imageUrl: null, buttons: [{ id: MSG_BUTTON_A, label: 'Yes' }] }
					},
					{
						id: TAGADD_ID,
						type: 'tagAdd',
						position: { x: 100, y: 100 },
						data: { tagId: TAG_ID }
					}
				],
				edges: [
					{
						id: 'dangling-handle',
						source: MESSAGE_ID,
						target: TAGADD_ID,
						sourceHandle: MSG_BUTTON_B // not a button on the source node
					}
				]
			};
			expect(() => cloneFlow(flow)).toThrow(/unknown sourceHandle id/);
		});

		it('treats a null sourceHandle as absent rather than throwing', () => {
			// SvelteFlow can normalise a handleless edge to `sourceHandle: null`.
			const flow = {
				nodes: [
					{
						id: TARGETING_ID,
						type: 'targeting',
						position: { x: 0, y: 0 },
						data: { filter: structuredClone(defaultFilterGroup) }
					},
					{
						id: TAGADD_ID,
						type: 'tagAdd',
						position: { x: 100, y: 100 },
						data: { tagId: TAG_ID }
					}
				],
				edges: [
					{
						id: 'null-handle',
						source: TARGETING_ID,
						target: TAGADD_ID,
						sourceHandle: null
					}
				]
			} as unknown as Flow;
			const clone = cloneFlow(flow);
			expect(clone.edges).toHaveLength(1);
			expect(clone.edges[0].sourceHandle).toBeUndefined();
			expect(clone.edges[0].source).toBe(clone.nodes[0].id);
			expect(clone.edges[0].target).toBe(clone.nodes[1].id);
		});
	});
});
