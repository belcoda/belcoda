import { describe, expect, it } from 'vitest';
import {
	emptyButtonMessageNodeError,
	emptyMessageNodeError,
	validateFlowForSending,
	type Flow
} from './index';

const baseMessageNode = {
	id: '00000000-0000-4000-8000-000000000001',
	type: 'message' as const,
	position: { x: 0, y: 0 }
};

function flowWithMessage(data: Flow['nodes'][number]['data']): Flow {
	return {
		nodes: [
			{
				...baseMessageNode,
				data
			} as Flow['nodes'][number]
		],
		edges: []
	};
}

describe('validateFlowForSending', () => {
	it('rejects a message node with no text or image', () => {
		const issues = validateFlowForSending(
			flowWithMessage({
				text: '',
				imageUrl: null,
				buttons: []
			})
		);

		expect(issues).toEqual([
			{
				nodeId: baseMessageNode.id,
				message: emptyMessageNodeError
			}
		]);
	});

	it('rejects a message node with buttons and no text', () => {
		const issues = validateFlowForSending(
			flowWithMessage({
				text: ' ',
				imageUrl: 'https://example.com/image.jpg',
				buttons: [{ id: '00000000-0000-4000-8000-000000000002', label: 'Yes' }]
			})
		);

		expect(issues).toEqual([
			{
				nodeId: baseMessageNode.id,
				message: emptyButtonMessageNodeError
			}
		]);
	});

	it('allows an image-only message node without buttons', () => {
		const issues = validateFlowForSending(
			flowWithMessage({
				text: '',
				imageUrl: 'https://example.com/image.jpg',
				buttons: []
			})
		);

		expect(issues).toEqual([]);
	});

	it('allows a button message with text', () => {
		const issues = validateFlowForSending(
			flowWithMessage({
				text: 'Choose an option',
				imageUrl: null,
				buttons: [{ id: '00000000-0000-4000-8000-000000000002', label: 'Yes' }]
			})
		);

		expect(issues).toEqual([]);
	});
});
