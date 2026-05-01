import { describe, expect, it } from 'vitest';
import * as v from 'valibot';
import {
	templateVariableGroups,
	templateVariableKey,
	templateVariableKeys
} from './template-variables';

describe('template variable schema', () => {
	it('accepts known variable keys', () => {
		expect(v.parse(templateVariableKey, 'person.given_name')).toBe('person.given_name');
	});

	it('rejects unknown variable keys', () => {
		expect(() => v.parse(templateVariableKey, 'person.nickname')).toThrow();
	});

	it('includes each key once in the grouped catalog', () => {
		const groupedKeys = templateVariableGroups.flatMap((group) =>
			group.variables.map((variable) => variable.key)
		);

		expect(groupedKeys).toEqual([...templateVariableKeys]);
		expect(new Set(groupedKeys).size).toBe(templateVariableKeys.length);
	});

	it('keeps grouped variables under their matching context', () => {
		for (const group of templateVariableGroups) {
			for (const variable of group.variables) {
				expect(variable.key.startsWith(`${group.context}.`)).toBe(true);
				expect(variable.context).toBe(group.context);
			}
		}
	});
});
