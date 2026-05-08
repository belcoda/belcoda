import { describe, expect, it } from 'vitest';
import {
	convertWhatsappMessageToApiFormat,
	convertWhatsAppTemplateMessageToApiFormat
} from './convert_outbound';

const threadId = '00000000-0000-4000-8000-000000000001';
const nodeId = '00000000-0000-4000-8000-000000000002';
const messageId = '00000000-0000-4000-8000-000000000003';

describe('YCloud outbound WhatsApp conversion', () => {
	it('sends normal messages to recipient without to when BSUID is selected', () => {
		const converted = convertWhatsappMessageToApiFormat({
			whatsappMessage: {
				id: messageId,
				text: 'Hello',
				emojiReactions: []
			},
			nodeId,
			whatsappThreadId: threadId,
			whatsappMessageId: messageId,
			from: '+15550000000',
			recipient: 'US.13491208655302741918'
		});

		expect(converted).toMatchObject({
			from: '+15550000000',
			recipient: 'US.13491208655302741918',
			type: 'text',
			text: { body: 'Hello' }
		});
		expect('to' in converted).toBe(false);
	});

	it('sends template messages to recipient without to when BSUID is selected', () => {
		const converted = convertWhatsAppTemplateMessageToApiFormat({
			templateMessage: {
				templateId: '00000000-0000-4000-8000-000000000004',
				body: {
					templateStrings: ['Maria']
				}
			},
			nodeId,
			whatsappThreadId: threadId,
			whatsappMessageId: messageId,
			from: '+15550000000',
			recipient: 'US.13491208655302741918',
			name: 'welcome',
			language: 'en'
		});

		expect(converted).toMatchObject({
			from: '+15550000000',
			recipient: 'US.13491208655302741918',
			type: 'template',
			template: {
				name: 'welcome'
			}
		});
		expect('to' in converted).toBe(false);
	});

	it('falls back to to for phone-number sends', () => {
		const converted = convertWhatsappMessageToApiFormat({
			whatsappMessage: {
				id: messageId,
				text: 'Hello',
				emojiReactions: []
			},
			nodeId,
			whatsappThreadId: threadId,
			whatsappMessageId: messageId,
			from: '+15550000000',
			to: '+15551112222'
		});

		expect(converted).toMatchObject({
			from: '+15550000000',
			to: '+15551112222',
			type: 'text',
			text: { body: 'Hello' }
		});
		expect('recipient' in converted).toBe(false);
	});
});
