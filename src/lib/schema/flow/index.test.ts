import { describe, expect, it } from 'vitest';
import * as v from 'valibot';
import { whatsappTemplateMessageNodeData } from './index';

const templateId = '00000000-0000-4000-8000-000000000000';

describe('whatsappTemplateMessageNodeData', () => {
	it('keeps legacy templateStrings valid', () => {
		const parsed = v.parse(whatsappTemplateMessageNodeData, {
			templateId,
			body: {
				templateStrings: ['Maria']
			}
		});

		expect(parsed.body?.templateStrings).toEqual(['Maria']);
	});

	it('accepts template parameter sources', () => {
		const parsed = v.parse(whatsappTemplateMessageNodeData, {
			templateId,
			body: {
				templateParams: [
					{ type: 'variable', key: 'person.given_name', fallback: 'there' },
					{ type: 'literal', value: 'our next event' }
				]
			}
		});

		expect(parsed.body?.templateParams).toEqual([
			{ type: 'variable', key: 'person.given_name', fallback: 'there' },
			{ type: 'literal', value: 'our next event' }
		]);
	});
});
