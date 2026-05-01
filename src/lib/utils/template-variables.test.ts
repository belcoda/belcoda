import { describe, expect, it } from 'vitest';
import { formatTemplateVariable, insertTemplateVariable } from './template-variables';

describe('template variable utilities', () => {
	describe('formatTemplateVariableToken', () => {
		it('formats a variable key', () => {
			expect(formatTemplateVariable('person.given_name')).toBe('{{person.given_name}}');
		});

		it('formats a template variable', () => {
			expect(formatTemplateVariable({ key: 'organization.name' })).toBe('{{organization.name}}');
		});
	});

	describe('insertTemplateVariableToken', () => {
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
});
