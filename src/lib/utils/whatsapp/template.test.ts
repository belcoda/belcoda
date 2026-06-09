import { describe, expect, it } from 'vitest';
import { createDefaultTemplate } from '$lib/server/db/seed/whatsapp/template';
import { createMessageFromTemplateAndTemplateMessage } from './template';
import type { WhatsappTemplateMessageData } from '$lib/schema/flow';

const templateId = '00000000-0000-4000-8000-000000000001';
const orgId = '00000000-0000-4000-8000-000000000002';
const messageId = '00000000-0000-4000-8000-000000000003';

const defaultTemplate = createDefaultTemplate({ organizationId: orgId, id: templateId });

describe('createMessageFromTemplateAndTemplateMessage', () => {
	it('substitutes default template body variables', () => {
		const templateMessage: WhatsappTemplateMessageData = {
			templateId,
			body: {
				templateStrings: ['Maria'],
				templateParams: [{ type: 'literal', value: 'Maria' }]
			},
			header: {},
			buttons: []
		};

		const result = createMessageFromTemplateAndTemplateMessage({
			templateMessage,
			template: defaultTemplate.components,
			messageId
		});

		expect(result.text).toBe('Hi Maria, do you have a second to talk?');
	});

	it('keeps unfilled placeholders when template string is missing', () => {
		const templateMessage: WhatsappTemplateMessageData = {
			templateId,
			body: {
				templateStrings: [],
				templateParams: []
			},
			header: {},
			buttons: []
		};

		const result = createMessageFromTemplateAndTemplateMessage({
			templateMessage,
			template: defaultTemplate.components,
			messageId
		});

		expect(result.text).toBe('Hi {{1}}, do you have a second to talk?');
	});

	it('substitutes HEADER TEXT variables when present', () => {
		const template = [
			{
				type: 'HEADER' as const,
				format: 'TEXT' as const,
				text: 'Hello {{1}}',
				example: { header_text: ['World'] }
			},
			{
				type: 'BODY' as const,
				text: 'Body text',
				example: { body_text: [['x']] }
			}
		];

		const templateMessage: WhatsappTemplateMessageData = {
			templateId,
			header: {
				templateStrings: ['World'],
				templateParams: [{ type: 'literal', value: 'World' }]
			},
			body: {
				templateStrings: ['x'],
				templateParams: [{ type: 'literal', value: 'x' }]
			},
			buttons: []
		};

		const result = createMessageFromTemplateAndTemplateMessage({
			templateMessage,
			template,
			messageId
		});

		expect(result.headerText).toBe('Hello World');
		expect(result.text).toBe('Body text');
	});
});
