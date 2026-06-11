import { describe, expect, it } from 'vitest';
import { parseTemplate } from './parseTemplate';

describe('parseTemplate', () => {
	it('parses default template body into text and variable tokens', () => {
		expect(parseTemplate('Hi {{1}}, do you have a second to talk?')).toEqual([
			{ type: 'text', value: 'Hi ' },
			{ type: 'var', id: 1 },
			{ type: 'text', value: ', do you have a second to talk?' }
		]);
	});

	it('returns a single text token when there are no variables', () => {
		expect(parseTemplate('Plain message')).toEqual([{ type: 'text', value: 'Plain message' }]);
	});
});
