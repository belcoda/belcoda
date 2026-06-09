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
		const result = applyTemplateDefaults(current, defaultComponents, { mergeExisting: true });
		expect(result.bodyParams).toEqual([{ type: 'literal', value: 'E2E Name' }]);
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
		expect(patched).toEqual([
			{ type: 'variable', key: 'person.given_name', fallback: 'Maria' }
		]);
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
