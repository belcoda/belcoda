import { describe, expect, it } from 'vitest';
import {
	formatTemplateVariable,
	insertTemplateVariable,
	resolveTemplateParamSources,
	resolveTemplateVariables
} from './template-variables';

describe('template variable utilities', () => {
	describe('formatTemplateVariable', () => {
		it('formats a variable key', () => {
			expect(formatTemplateVariable('person.given_name')).toBe('{{person.given_name}}');
		});

		it('formats a template variable', () => {
			expect(formatTemplateVariable({ key: 'organization.name' })).toBe('{{organization.name}}');
		});
	});

	describe('insertTemplateVariable', () => {
		it('inserts the token at the cursor position', () => {
			const result = insertTemplateVariable('Hello ', '{{person.given_name}}', 6, 6);

			expect(result).toEqual({
				value: 'Hello {{person.given_name}}',
				cursorPosition: 27
			});
		});

		it('replaces the selected range with the token', () => {
			const result = insertTemplateVariable('Hello friend', '{{person.given_name}}', 6, 12);

			expect(result).toEqual({
				value: 'Hello {{person.given_name}}',
				cursorPosition: 27
			});
		});

		it('appends the token when there is no selection', () => {
			const result = insertTemplateVariable('Hello ', '{{person.given_name}}');

			expect(result).toEqual({
				value: 'Hello {{person.given_name}}',
				cursorPosition: 27
			});
		});

		it('handles reversed selection bounds', () => {
			const result = insertTemplateVariable('Hello friend', '{{person.given_name}}', 12, 6);

			expect(result).toEqual({
				value: 'Hello {{person.given_name}}',
				cursorPosition: 27
			});
		});

		it('clamps selection bounds to the text length', () => {
			const result = insertTemplateVariable('Hello', '{{person.given_name}}', -10, 100);

			expect(result).toEqual({
				value: '{{person.given_name}}',
				cursorPosition: 21
			});
		});
	});

	describe('resolveTemplateParamSources', () => {
		it('returns literal parameter values', () => {
			expect(
				resolveTemplateParamSources({
					templateParams: [{ type: 'literal', value: 'Maria' }],
					values: {}
				})
			).toEqual(['Maria']);
		});

		it('resolves variable parameter values', () => {
			expect(
				resolveTemplateParamSources({
					templateParams: [{ type: 'variable', key: 'person.given_name' }],
					values: { 'person.given_name': 'Ada' }
				})
			).toEqual(['Ada']);
		});

		it('uses fallback text when a variable value is missing', () => {
			expect(
				resolveTemplateParamSources({
					templateParams: [{ type: 'variable', key: 'person.given_name', fallback: 'there' }],
					values: {}
				})
			).toEqual(['there']);
		});

		it('uses an empty string when a variable value and fallback are missing', () => {
			expect(
				resolveTemplateParamSources({
					templateParams: [{ type: 'variable', key: 'person.given_name' }],
					values: {}
				})
			).toEqual(['']);
		});

		it('treats legacy template strings as literal values', () => {
			expect(
				resolveTemplateParamSources({
					templateStrings: ['Maria', 'the rally'],
					values: {}
				})
			).toEqual(['Maria', 'the rally']);
		});

		it('prefers template parameter sources over legacy template strings', () => {
			expect(
				resolveTemplateParamSources({
					templateParams: [{ type: 'variable', key: 'person.given_name' }],
					templateStrings: ['Maria'],
					values: { 'person.given_name': 'Ada' }
				})
			).toEqual(['Ada']);
		});
	});

	describe('resolveTemplateVariables', () => {
		it('replaces known inline variable tokens', () => {
			expect(
				resolveTemplateVariables('Hi {{person.given_name}} from {{organization.name}}', {
					'person.given_name': 'Ada',
					'organization.name': 'Belcoda'
				})
			).toBe('Hi Ada from Belcoda');
		});

		it('allows whitespace inside variable tokens', () => {
			expect(
				resolveTemplateVariables('Hi {{ person.given_name }}', {
					'person.given_name': 'Ada'
				})
			).toBe('Hi Ada');
		});

		it('uses an empty string when a known variable has no value', () => {
			expect(resolveTemplateVariables('Hi {{person.given_name}}', {})).toBe('Hi ');
		});

		it('preserves unknown tokens', () => {
			expect(resolveTemplateVariables('Hi {{custom.value}}', {})).toBe('Hi {{custom.value}}');
		});
	});
});
