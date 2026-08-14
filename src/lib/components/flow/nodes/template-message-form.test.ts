import { describe, expect, it } from 'vitest';
import { createDefaultTemplate } from '$lib/server/db/seed/whatsapp/template';
import type { TemplateMessageComponents } from '$lib/schema/whatsapp/template/index';
import {
	applyTemplateDefaults,
	buildNodeData,
	cloneTemplateMessageData,
	getInitialParamSources,
	getParamDisplayValue,
	patchParamSource,
	patchParamSourceType,
	type TemplateMessageFormState
} from './template-message-form';

const templateId = '00000000-0000-4000-8000-000000000001';
const orgId = '00000000-0000-4000-8000-000000000002';

const defaultComponents = createDefaultTemplate({
	organizationId: orgId,
	id: templateId
}).components as TemplateMessageComponents;

function emptyFormState(): TemplateMessageFormState {
	return {
		templateId,
		headerParams: [],
		bodyParams: [],
		buttons: [],
		headerImageUrl: null
	};
}

describe('getInitialParamSources', () => {
	it('prefers templateParams over legacy templateStrings', () => {
		const result = getInitialParamSources(
			[{ type: 'variable', key: 'person.given_name', fallback: 'there' }],
			['Maria']
		);
		expect(result).toEqual([{ type: 'variable', key: 'person.given_name', fallback: 'there' }]);
	});

	it('maps templateStrings to literal params when templateParams are absent', () => {
		expect(getInitialParamSources(undefined, ['Maria', 'event'])).toEqual([
			{ type: 'literal', value: 'Maria' },
			{ type: 'literal', value: 'event' }
		]);
	});
});

describe('cloneTemplateMessageData', () => {
	it('round-trips header and body params', () => {
		const cloned = cloneTemplateMessageData({
			templateId,
			header: {
				templateParams: [{ type: 'literal', value: 'Welcome' }]
			},
			body: {
				templateParams: [{ type: 'literal', value: 'Maria' }]
			},
			buttons: []
		});

		expect(cloned.templateId).toBe(templateId);
		expect(cloned.headerParams).toEqual([{ type: 'literal', value: 'Welcome' }]);
		expect(cloned.bodyParams).toEqual([{ type: 'literal', value: 'Maria' }]);
	});
});

describe('applyTemplateDefaults', () => {
	it('seeds body literal from template example', () => {
		const result = applyTemplateDefaults(emptyFormState(), defaultComponents, {
			mergeExisting: false
		});
		expect(result.bodyParams).toEqual([{ type: 'literal', value: 'Maria' }]);
	});

	it('preserves existing body params when mergeExisting is true', () => {
		const current = {
			...emptyFormState(),
			bodyParams: [{ type: 'literal', value: 'E2E Name' }]
		};
		const result = applyTemplateDefaults(current as TemplateMessageFormState, defaultComponents, {
			mergeExisting: true
		});
		expect(result.bodyParams).toEqual([{ type: 'literal', value: 'E2E Name' }]);
	});

	it('tolerates IMAGE headers without example.header_url', () => {
		const components = [
			{
				type: 'HEADER',
				format: 'IMAGE',
				example: {}
			},
			{
				type: 'BODY',
				text: 'Hello {{1}}',
				example: { body_text: [['Maria']] }
			}
		] as TemplateMessageComponents;

		expect(() =>
			applyTemplateDefaults(emptyFormState(), components, { mergeExisting: false })
		).not.toThrow();
		expect(
			applyTemplateDefaults(emptyFormState(), components, { mergeExisting: false }).headerImageUrl
		).toBeNull();
	});

	it('tolerates TEXT headers without example.header_text', () => {
		const components = [
			{
				type: 'HEADER',
				format: 'TEXT',
				text: 'Hello {{1}}',
				example: {}
			},
			{
				type: 'BODY',
				text: 'Hello {{1}}',
				example: { body_text: [['Maria']] }
			}
		] as TemplateMessageComponents;

		expect(() =>
			applyTemplateDefaults(emptyFormState(), components, { mergeExisting: false })
		).not.toThrow();
		expect(
			applyTemplateDefaults(emptyFormState(), components, { mergeExisting: false }).headerParams
		).toEqual([]);
	});
});

describe('applyTemplateDefaults button handling', () => {
	const bodyOnly = [
		{ type: 'BODY', text: 'Hello {{1}}', example: { body_text: [['Maria']] } }
	] as TemplateMessageComponents;

	function withButtons(count: number): TemplateMessageComponents {
		return [
			{ type: 'BODY', text: 'Hello {{1}}', example: { body_text: [['Maria']] } },
			{
				type: 'BUTTONS',
				buttons: Array.from({ length: count }, (_, i) => ({
					type: 'QUICK_REPLY',
					text: `Option ${i + 1}`
				}))
			}
		] as TemplateMessageComponents;
	}

	it('clears stale buttons when the template has no BUTTONS component', () => {
		const current = {
			...emptyFormState(),
			buttons: [{ id: '00000000-0000-4000-8000-00000000aaaa' }]
		};
		const result = applyTemplateDefaults(current as TemplateMessageFormState, bodyOnly, {
			mergeExisting: true
		});
		expect(result.buttons).toEqual([]);
	});

	it('keeps one button per template entry, preserving existing ids and appending new ones', () => {
		const existingId = '00000000-0000-4000-8000-00000000bbbb';
		const current = { ...emptyFormState(), buttons: [{ id: existingId }] };
		const result = applyTemplateDefaults(current as TemplateMessageFormState, withButtons(2), {
			mergeExisting: true
		});
		expect(result.buttons).toHaveLength(2);
		expect(result.buttons[0].id).toBe(existingId);
		expect(result.buttons[1].id).toEqual(expect.any(String));
		expect(result.buttons[1].id).not.toBe(existingId);
	});

	it('truncates buttons when the template has fewer than the node', () => {
		const keepId = '00000000-0000-4000-8000-00000000cccc';
		const current = {
			...emptyFormState(),
			buttons: [{ id: keepId }, { id: '00000000-0000-4000-8000-00000000dddd' }]
		};
		const result = applyTemplateDefaults(current as TemplateMessageFormState, withButtons(1), {
			mergeExisting: true
		});
		expect(result.buttons).toEqual([{ id: keepId }]);
	});
});

describe('patchParamSource and patchParamSourceType', () => {
	it('replaces a param at the given index', () => {
		const params = [{ type: 'literal' as const, value: 'Maria' }];
		const patched = patchParamSource(params, 0, { type: 'literal', value: 'Pat' });
		expect(patched).toEqual([{ type: 'literal', value: 'Pat' }]);
	});

	it('switches literal to variable preserving string as fallback', () => {
		const params = [{ type: 'literal' as const, value: 'Maria' }];
		const patched = patchParamSourceType(params, 0, 'variable');
		expect(patched).toEqual([{ type: 'variable', key: 'person.given_name', fallback: 'Maria' }]);
	});

	it('switches variable to literal using fallback as value', () => {
		const params = [
			{ type: 'variable' as const, key: 'person.given_name' as const, fallback: 'there' }
		];
		const patched = patchParamSourceType(params, 0, 'literal');
		expect(patched).toEqual([{ type: 'literal', value: 'there' }]);
	});
});

describe('buildNodeData', () => {
	it('produces templateStrings aligned with param sources', () => {
		const nodeData = buildNodeData({
			...emptyFormState(),
			bodyParams: [
				{ type: 'literal', value: 'E2E Name' },
				{ type: 'variable', key: 'person.given_name', fallback: 'friend' }
			]
		});

		expect(nodeData.body?.templateStrings).toEqual(['E2E Name', 'friend']);
		expect(nodeData.body?.templateParams).toEqual([
			{ type: 'literal', value: 'E2E Name' },
			{ type: 'variable', key: 'person.given_name', fallback: 'friend' }
		]);
	});
});

describe('getParamDisplayValue', () => {
	it('returns literal value when set', () => {
		const value = getParamDisplayValue([{ type: 'literal', value: 'Maria' }], 0, '{{1}}');
		expect(value).toBe('Maria');
	});

	it('appends fallback after arrow for variable params', () => {
		const value = getParamDisplayValue(
			[{ type: 'variable', key: 'person.given_name', fallback: 'there' }],
			0,
			'{{1}}'
		);
		expect(value).toContain('→ there');
	});
});
