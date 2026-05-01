import { describe, expect, it } from 'vitest';
import { formatTemplateVariableToken, insertTemplateVariableToken } from './template-variables';

describe('template variable utilities', () => {
	describe('formatTemplateVariableToken', () => {
		it('formats a variable key', () => {
			expect(formatTemplateVariableToken('person.given_name')).toBe('{{person.given_name}}');
		});

		it('formats a template variable', () => {
			expect(formatTemplateVariableToken({ key: 'organization.name' })).toBe(
				'{{organization.name}}'
			);
		});
	});

	describe('insertTemplateVariableToken', () => {
		it('inserts the token at the cursor position', () => {
			const result = insertTemplateVariableToken('Hello ', '{{person.given_name}}', 6, 6);

			expect(result).toEqual({
				value: 'Hello {{person.given_name}}',
				cursorPosition: 27
			});
		});

		it('replaces the selected range with the token', () => {
			const result = insertTemplateVariableToken('Hello friend', '{{person.given_name}}', 6, 12);

			expect(result).toEqual({
				value: 'Hello {{person.given_name}}',
				cursorPosition: 27
			});
		});

		it('appends the token when there is no selection', () => {
			const result = insertTemplateVariableToken('Hello ', '{{person.given_name}}');

			expect(result).toEqual({
				value: 'Hello {{person.given_name}}',
				cursorPosition: 27
			});
		});

		it('handles reversed selection bounds', () => {
			const result = insertTemplateVariableToken('Hello friend', '{{person.given_name}}', 12, 6);

			expect(result).toEqual({
				value: 'Hello {{person.given_name}}',
				cursorPosition: 27
			});
		});

		it('clamps selection bounds to the text length', () => {
			const result = insertTemplateVariableToken('Hello', '{{person.given_name}}', -10, 100);

			expect(result).toEqual({
				value: '{{person.given_name}}',
				cursorPosition: 21
			});
		});
	});
});
