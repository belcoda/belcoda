import { describe, expect, it } from 'vitest';
import type { Node } from '@xyflow/svelte';
import { createDefaultEdge, parentAllowsDefaultAutoEdge } from './addNode';
import type { TemplateMessageComponents } from '$lib/schema/whatsapp/template';

const templateId = '00000000-0000-4000-8000-000000000000';

function messageNode(buttons: { id: string; label: string }[] = []): Node {
	return {
		id: 'message-1',
		type: 'message',
		position: { x: 0, y: 0 },
		data: { text: 'Hi', buttons, imageUrl: null }
	};
}

function templateMessageNode(): Node {
	return {
		id: 'template-1',
		type: 'templateMessage',
		position: { x: 0, y: 0 },
		data: { templateId }
	};
}

describe('createDefaultEdge', () => {
	it('links source to target with edge type', () => {
		const edge = createDefaultEdge('source-id', 'target-id');
		expect(edge.source).toBe('source-id');
		expect(edge.target).toBe('target-id');
		expect(edge.type).toBe('edge');
		expect(edge.id).toBeTruthy();
	});
});

describe('parentAllowsDefaultAutoEdge', () => {
	it('allows message nodes without buttons', () => {
		expect(parentAllowsDefaultAutoEdge(messageNode())).toBe(true);
	});

	it('disallows message nodes with buttons', () => {
		expect(parentAllowsDefaultAutoEdge(messageNode([{ id: 'btn-1', label: 'Yes' }]))).toBe(false);
	});

	it('allows template nodes when template has no buttons', () => {
		const components: TemplateMessageComponents = [
			{
				type: 'BODY',
				text: 'Hello',
				example: { body_text: [['there']] }
			}
		];
		expect(
			parentAllowsDefaultAutoEdge(templateMessageNode(), { templateComponents: components })
		).toBe(true);
	});

	it('disallows template nodes when template has buttons', () => {
		const components: TemplateMessageComponents = [
			{
				type: 'BODY',
				text: 'Hello',
				example: { body_text: [['there']] }
			},
			{
				type: 'BUTTONS',
				buttons: [{ type: 'QUICK_REPLY', text: 'Yes' }]
			}
		];
		expect(
			parentAllowsDefaultAutoEdge(templateMessageNode(), { templateComponents: components })
		).toBe(false);
	});

	it('disallows template nodes when template components are not loaded', () => {
		expect(parentAllowsDefaultAutoEdge(templateMessageNode())).toBe(false);
		expect(parentAllowsDefaultAutoEdge(templateMessageNode(), { templateComponents: null })).toBe(
			false
		);
	});

	it('allows other node types', () => {
		const eventSignup: Node = {
			id: 'event-1',
			type: 'eventSignup',
			position: { x: 0, y: 0 },
			data: { eventId: '00000000-0000-4000-8000-000000000001' }
		};
		expect(parentAllowsDefaultAutoEdge(eventSignup)).toBe(true);
	});
});
