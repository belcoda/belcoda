import { describe, it, expect } from 'vitest';
import { getNextNodeToProcess } from './index';
import type { Flow } from '$lib/schema/flow/node/index';

// Deterministic literal ids so failures read clearly.
const SOURCE = '11111111-1111-4111-8111-111111111111';
const AUTO_TARGET = '22222222-2222-4222-8222-222222222222';
const BRANCH_TARGET = '33333333-3333-4333-8333-333333333333';
const HANDLE_A = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

// getNextNodeToProcess only reads node ids and edge source/handle/target at
// runtime, so a structurally-minimal graph cast to Flow is enough here.
function flowWith(edges: Flow['edges']): Flow {
	return {
		nodes: [
			{ id: SOURCE, position: { x: 0, y: 0 }, data: { type: 'tag.add', tagId: HANDLE_A } },
			{ id: AUTO_TARGET, position: { x: 0, y: 0 }, data: { type: 'tag.add', tagId: HANDLE_A } },
			{ id: BRANCH_TARGET, position: { x: 0, y: 0 }, data: { type: 'tag.add', tagId: HANDLE_A } }
		],
		edges
	} as unknown as Flow;
}

describe('getNextNodeToProcess', () => {
	it('returns null when the node has no outgoing edge', () => {
		const flow = flowWith([]);
		expect(getNextNodeToProcess({ nodeId: SOURCE, flow })).toBeNull();
	});

	it('follows a handleless auto-continuation edge when no handle is requested', () => {
		const flow = flowWith([{ id: 'auto', source: SOURCE, target: AUTO_TARGET }]);
		expect(getNextNodeToProcess({ nodeId: SOURCE, flow })).toBe(AUTO_TARGET);
	});

	it('does NOT auto-follow a button/branch edge (with a sourceHandle) when no handle is requested', () => {
		// Only a keyed branch edge exists. Without a handle press this is not a valid
		// auto-continuation — matching it would replay the BEL-1058 orphaned-edge bug.
		const flow = flowWith([
			{ id: 'branch', source: SOURCE, target: BRANCH_TARGET, sourceHandle: HANDLE_A }
		]);
		expect(getNextNodeToProcess({ nodeId: SOURCE, flow })).toBeNull();
	});

	it('prefers the handleless edge when the node has both a branch and a continuation', () => {
		const flow = flowWith([
			{ id: 'branch', source: SOURCE, target: BRANCH_TARGET, sourceHandle: HANDLE_A },
			{ id: 'auto', source: SOURCE, target: AUTO_TARGET }
		]);
		expect(getNextNodeToProcess({ nodeId: SOURCE, flow })).toBe(AUTO_TARGET);
	});

	it('resolves the requested handle to its branch target', () => {
		const flow = flowWith([
			{ id: 'branch', source: SOURCE, target: BRANCH_TARGET, sourceHandle: HANDLE_A },
			{ id: 'auto', source: SOURCE, target: AUTO_TARGET }
		]);
		expect(getNextNodeToProcess({ nodeId: SOURCE, handleId: HANDLE_A, flow })).toBe(BRANCH_TARGET);
	});

	it('returns null when the requested handle has no matching edge', () => {
		const flow = flowWith([{ id: 'auto', source: SOURCE, target: AUTO_TARGET }]);
		expect(getNextNodeToProcess({ nodeId: SOURCE, handleId: HANDLE_A, flow })).toBeNull();
	});

	it('throws when the node does not exist', () => {
		const flow = flowWith([]);
		expect(() => getNextNodeToProcess({ nodeId: 'ghost', flow })).toThrow();
	});
});
