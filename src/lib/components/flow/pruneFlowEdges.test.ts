import { describe, it, expect } from 'vitest';
import { pruneDanglingEdges, nodeHandleIds } from './pruneFlowEdges';
import { structuredClone } from '$lib/utils/structuredClone';
import type { Flow } from '$lib/schema/flow/index';

// Deterministic literal ids so failures read clearly. Shapes below are inspired
// by real exported flows but stripped of all names, copy and identifying data.
const TARGETING = '11111111-1111-4111-8111-111111111111';
const TEMPLATE = '22222222-2222-4222-8222-222222222222';
const MESSAGE = '33333333-3333-4333-8333-333333333333';
const REPLY_A = '44444444-4444-4444-8444-444444444444';
const REPLY_B = '55555555-5555-4555-8555-555555555555';
const REPLY_C = '66666666-6666-4666-8666-666666666666';

const TPL_BTN_1 = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const TPL_BTN_2 = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const TPL_BTN_3 = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const MSG_BTN_1 = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';
const MSG_BTN_2 = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee';

const TEMPLATE_META_ID = 'f0f0f0f0-f0f0-4f0f-8f0f-f0f0f0f0f0f0';

/** targeting -> templateMessage(2 buttons) -> two message leaves. All valid. */
function validFlow(): Flow {
	return {
		nodes: [
			{
				id: TARGETING,
				type: 'targeting',
				position: { x: 0, y: 0 },
				data: { filter: { type: 'and', filters: [], exclude: [] } }
			},
			{
				id: TEMPLATE,
				type: 'templateMessage',
				position: { x: 0, y: 100 },
				data: {
					templateId: TEMPLATE_META_ID,
					buttons: [{ id: TPL_BTN_1 }, { id: TPL_BTN_2 }]
				}
			},
			{
				id: REPLY_A,
				type: 'message',
				position: { x: -100, y: 200 },
				data: { text: 'First reply', imageUrl: null, buttons: [] }
			},
			{
				id: REPLY_B,
				type: 'message',
				position: { x: 100, y: 200 },
				data: { text: 'Second reply', imageUrl: null, buttons: [] }
			}
		],
		edges: [
			{ id: `xy-edge__${TARGETING}--${TEMPLATE}`, source: TARGETING, target: TEMPLATE },
			{
				id: `xy-edge__${TPL_BTN_1}--${REPLY_A}`,
				source: TEMPLATE,
				target: REPLY_A,
				sourceHandle: TPL_BTN_1
			},
			{
				id: `xy-edge__${TPL_BTN_2}--${REPLY_B}`,
				source: TEMPLATE,
				target: REPLY_B,
				sourceHandle: TPL_BTN_2
			}
		]
	};
}

describe('nodeHandleIds', () => {
	it('returns the button ids of a message node', () => {
		const node = {
			id: MESSAGE,
			data: {
				buttons: [
					{ id: MSG_BTN_1, label: 'A' },
					{ id: MSG_BTN_2, label: 'B' }
				]
			}
		};
		expect(nodeHandleIds(node)).toEqual(new Set([MSG_BTN_1, MSG_BTN_2]));
	});

	it('returns an empty set for a node with no buttons', () => {
		expect(nodeHandleIds({ id: TARGETING, data: { filter: {} } })).toEqual(new Set());
	});

	it('returns an empty set when data or buttons are absent', () => {
		expect(nodeHandleIds({ id: TARGETING })).toEqual(new Set());
		expect(nodeHandleIds({ id: TARGETING, data: null })).toEqual(new Set());
		expect(nodeHandleIds({ id: TARGETING, data: {} })).toEqual(new Set());
	});

	it('ignores malformed button entries', () => {
		const node = {
			id: MESSAGE,
			data: { buttons: [{ id: MSG_BTN_1 }, { label: 'no id' }, null, 42, { id: 7 }] }
		} as unknown as Parameters<typeof nodeHandleIds>[0];
		expect(nodeHandleIds(node)).toEqual(new Set([MSG_BTN_1]));
	});
});

describe('pruneDanglingEdges', () => {
	describe('valid graphs', () => {
		it('keeps every edge of a fully-valid flow', () => {
			const flow = validFlow();
			const { edges, removed } = pruneDanglingEdges(flow.nodes, flow.edges);
			expect(removed).toHaveLength(0);
			expect(edges).toHaveLength(flow.edges.length);
		});

		it('returns surviving edges by reference (no cloning)', () => {
			const flow = validFlow();
			const { edges } = pruneDanglingEdges(flow.nodes, flow.edges);
			edges.forEach((edge, i) => expect(edge).toBe(flow.edges[i]));
		});

		it('does not mutate its inputs', () => {
			const flow = validFlow();
			const nodesSnapshot = structuredClone(flow.nodes);
			const edgesSnapshot = structuredClone(flow.edges);
			pruneDanglingEdges(flow.nodes, flow.edges);
			expect(flow.nodes).toEqual(nodesSnapshot);
			expect(flow.edges).toEqual(edgesSnapshot);
		});

		it('handles an empty edge list', () => {
			const flow = validFlow();
			expect(pruneDanglingEdges(flow.nodes, [])).toEqual({ edges: [], removed: [] });
		});

		it('keeps a handleless edge between two existing nodes', () => {
			const nodes = validFlow().nodes;
			const edge = { id: 'plain', source: TARGETING, target: TEMPLATE };
			const { edges, removed } = pruneDanglingEdges(nodes, [edge]);
			expect(edges).toEqual([edge]);
			expect(removed).toHaveLength(0);
		});

		it('treats a null sourceHandle as absent and keeps the edge', () => {
			const nodes = validFlow().nodes;
			const edge = { id: 'null-handle', source: TARGETING, target: TEMPLATE, sourceHandle: null };
			const { edges, removed } = pruneDanglingEdges(nodes, [edge]);
			expect(edges).toEqual([edge]);
			expect(removed).toHaveLength(0);
		});
	});

	describe('missing nodes', () => {
		it('drops an edge whose target node does not exist', () => {
			const flow = validFlow();
			const dangling = { id: 'dangling', source: TARGETING, target: 'ghost-node' };
			const { edges, removed } = pruneDanglingEdges(flow.nodes, [...flow.edges, dangling]);
			expect(removed).toEqual([dangling]);
			expect(edges).toHaveLength(flow.edges.length);
		});

		it('drops an edge whose source node does not exist', () => {
			const flow = validFlow();
			const dangling = { id: 'dangling', source: 'ghost-node', target: TEMPLATE };
			const { edges, removed } = pruneDanglingEdges(flow.nodes, [...flow.edges, dangling]);
			expect(removed).toEqual([dangling]);
			expect(edges).toHaveLength(flow.edges.length);
		});

		it('drops a targeting-only flow edge that points at a never-created node', () => {
			// Mirrors the "startingNodes without a default template" bug: a lone
			// targeting node plus an edge to a message node that was never added.
			const nodes: Flow['nodes'] = [
				{
					id: TARGETING,
					type: 'targeting',
					position: { x: 0, y: 0 },
					data: { filter: { type: 'and', filters: [], exclude: [] } }
				}
			];
			const edges = [{ id: 'orphan', source: TARGETING, target: MESSAGE }];
			const result = pruneDanglingEdges(nodes, edges);
			expect(result.edges).toHaveLength(0);
			expect(result.removed).toEqual(edges);
		});
	});

	describe('stale handles', () => {
		it('drops an edge whose sourceHandle is not a button on the source node', () => {
			const nodes = validFlow().nodes;
			const stale = {
				id: 'stale',
				source: TEMPLATE,
				target: REPLY_A,
				sourceHandle: 'removed-button-id'
			};
			const { edges, removed } = pruneDanglingEdges(nodes, [stale]);
			expect(edges).toHaveLength(0);
			expect(removed).toEqual([stale]);
		});

		it('keeps an edge whose sourceHandle is a real button on another node', () => {
			// TPL_BTN_1 is a button of TEMPLATE. The runtime resolves a button press
			// by matching the pressed button id against every edge's source/sourceHandle
			// globally (not per-node), and cloneFlow can remap any known button id, so
			// a "cross-node" handle is resolvable and must be kept — pruning only drops
			// ids that exist nowhere in the flow.
			const nodes = validFlow().nodes;
			const crossNode = {
				id: 'cross',
				source: REPLY_A,
				target: REPLY_B,
				sourceHandle: TPL_BTN_1
			};
			const { edges, removed } = pruneDanglingEdges(nodes, [crossNode]);
			expect(edges).toEqual([crossNode]);
			expect(removed).toHaveLength(0);
		});

		it('keeps a legacy edge whose source is a button id (no sourceHandle)', () => {
			// The runtime's extractNextNodeFromButtonAction matches a pressed button
			// against `edge.source` OR `edge.sourceHandle`, so an edge may carry the
			// button id directly in `source`. Such edges are valid and must survive.
			const nodes = validFlow().nodes;
			const legacy = { id: 'legacy', source: TPL_BTN_1, target: REPLY_A };
			const { edges, removed } = pruneDanglingEdges(nodes, [legacy]);
			expect(edges).toEqual([legacy]);
			expect(removed).toHaveLength(0);
		});

		it('drops an edge with a sourceHandle when the source node has no buttons at all', () => {
			const nodes: Flow['nodes'] = [
				{
					id: MESSAGE,
					type: 'message',
					position: { x: 0, y: 0 },
					data: { text: 'no buttons', imageUrl: null, buttons: [] }
				},
				{
					id: REPLY_A,
					type: 'message',
					position: { x: 0, y: 100 },
					data: { text: 'leaf', imageUrl: null, buttons: [] }
				}
			];
			const stale = { id: 'stale', source: MESSAGE, target: REPLY_A, sourceHandle: MSG_BTN_1 };
			const { edges, removed } = pruneDanglingEdges(nodes, [stale]);
			expect(edges).toHaveLength(0);
			expect(removed).toEqual([stale]);
		});

		it('drops an edge whose targetHandle references an id that exists nowhere', () => {
			// MSG_BTN_1 is not a node or button anywhere in this flow, so the edge is
			// unresolvable even though its source/sourceHandle/target are all valid.
			const nodes = validFlow().nodes;
			const badTarget = {
				id: 'bad-target-handle',
				source: TEMPLATE,
				target: REPLY_A,
				sourceHandle: TPL_BTN_1,
				targetHandle: MSG_BTN_1
			};
			const { edges, removed } = pruneDanglingEdges(nodes, [badTarget]);
			expect(edges).toHaveLength(0);
			expect(removed).toEqual([badTarget]);
		});
	});

	describe('regenerated-button duplication (real-world shape)', () => {
		// A templateMessage whose buttons were regenerated (template re-selected):
		// the node now holds the NEW ids, but the edge list still carries the OLD,
		// stale handles alongside the new ones — all pointing at the same targets.
		const OLD_1 = 'old11111-1111-4111-8111-111111111111';
		const OLD_2 = 'old22222-2222-4222-8222-222222222222';
		const OLD_3 = 'old33333-3333-4333-8333-333333333333';

		function duplicatedFlow(): Flow {
			return {
				nodes: [
					{
						id: TARGETING,
						type: 'targeting',
						position: { x: 0, y: 0 },
						data: { filter: { type: 'or', filters: [], exclude: [] } }
					},
					{
						id: TEMPLATE,
						type: 'templateMessage',
						position: { x: 0, y: 100 },
						data: {
							templateId: TEMPLATE_META_ID,
							buttons: [{ id: TPL_BTN_1 }, { id: TPL_BTN_2 }, { id: TPL_BTN_3 }]
						}
					},
					{
						id: REPLY_A,
						type: 'message',
						position: { x: -100, y: 200 },
						data: { text: 'Yes path', imageUrl: null, buttons: [] }
					},
					{
						id: REPLY_B,
						type: 'message',
						position: { x: 0, y: 200 },
						data: { text: 'Maybe path', imageUrl: null, buttons: [] }
					},
					{
						id: REPLY_C,
						type: 'message',
						position: { x: 100, y: 200 },
						data: { text: 'No path', imageUrl: null, buttons: [] }
					}
				],
				edges: [
					{ id: `xy-edge__${TARGETING}--${TEMPLATE}`, source: TARGETING, target: TEMPLATE },
					// stale edges keyed on the old (regenerated-away) button ids
					{ id: 'stale-1', source: TEMPLATE, target: REPLY_A, sourceHandle: OLD_1 },
					{ id: 'stale-2', source: TEMPLATE, target: REPLY_B, sourceHandle: OLD_2 },
					{ id: 'stale-3', source: TEMPLATE, target: REPLY_C, sourceHandle: OLD_3 },
					// valid edges keyed on the current button ids, same targets
					{ id: 'valid-1', source: TEMPLATE, target: REPLY_A, sourceHandle: TPL_BTN_1 },
					{ id: 'valid-2', source: TEMPLATE, target: REPLY_B, sourceHandle: TPL_BTN_2 },
					{ id: 'valid-3', source: TEMPLATE, target: REPLY_C, sourceHandle: TPL_BTN_3 }
				]
			};
		}

		it('keeps the current-handle edges and drops the stale duplicates', () => {
			const flow = duplicatedFlow();
			const { edges, removed } = pruneDanglingEdges(flow.nodes, flow.edges);
			expect(edges.map((e) => e.id)).toEqual([
				`xy-edge__${TARGETING}--${TEMPLATE}`,
				'valid-1',
				'valid-2',
				'valid-3'
			]);
			expect(removed.map((e) => e.id)).toEqual(['stale-1', 'stale-2', 'stale-3']);
		});
	});

	describe('reporting', () => {
		it('reports every removed edge and keeps counts consistent', () => {
			const flow = validFlow();
			const extras = [
				{ id: 'x1', source: TARGETING, target: 'ghost' },
				{ id: 'x2', source: 'ghost', target: TEMPLATE },
				{ id: 'x3', source: TEMPLATE, target: REPLY_A, sourceHandle: 'nope' }
			];
			const { edges, removed } = pruneDanglingEdges(flow.nodes, [...flow.edges, ...extras]);
			expect(removed.map((e) => e.id).sort()).toEqual(['x1', 'x2', 'x3']);
			expect(edges).toHaveLength(flow.edges.length);
			expect(edges.length + removed.length).toBe(flow.edges.length + extras.length);
		});
	});
});
