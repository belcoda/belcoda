import { describe, expect, it } from 'vitest';
import * as v from 'valibot';
import { incomingMessageSchema } from './incoming_message';

describe('YCloud inbound WhatsApp message schema', () => {
	it('accepts legacy inbound messages without BSUID fields', () => {
		const parsed = v.parse(incomingMessageSchema, {
			id: 'evt_legacy',
			type: 'whatsapp.inbound_message.received',
			apiVersion: 'v2',
			createTime: '2023-02-22T12:00:00.000Z',
			whatsappInboundMessage: {
				id: '63f872f6741c165b4342a751',
				wamid: 'wamid.HBgNODi...',
				wabaId: 'WABA-ID',
				from: '447901614024',
				customerProfile: {
					name: 'Joe'
				},
				to: 'BUSINESS-PHONE-NUMBER',
				sendTime: '2023-02-22T12:00:00.000Z',
				type: 'text',
				text: {
					body: 'OK'
				}
			}
		});

		expect(parsed.whatsappInboundMessage.fromUserId).toBeUndefined();
	});

	it('accepts inbound BSUID fields from YCloud samples', () => {
		const parsed = v.parse(incomingMessageSchema, {
			id: 'evt_eEkn26qar3nOB8md',
			type: 'whatsapp.inbound_message.received',
			apiVersion: 'v2',
			createTime: '2023-02-22T12:00:00.000Z',
			whatsappInboundMessage: {
				id: '63f872f6741c165b4342a751',
				wamid: 'wamid.HBgNODi...',
				wabaId: 'WABA-ID',
				from: 'CUSTOMER-PHONE-NUMBER',
				fromUserId: 'US.13491208655302741918',
				fromParentUserId: 'US.11815799212886844830',
				customerProfile: {
					name: 'Joe',
					username: '@JoeJoe'
				},
				to: 'BUSINESS-PHONE-NUMBER',
				sendTime: '2023-02-22T12:00:00.000Z',
				type: 'text',
				text: {
					body: 'OK'
				},
				context: {
					from: '447901614024',
					id: 'wamid.HBgNODr...'
				}
			}
		});

		expect(parsed.whatsappInboundMessage.fromUserId).toBe('US.13491208655302741918');
		expect(parsed.whatsappInboundMessage.fromParentUserId).toBe('US.11815799212886844830');
		expect(parsed.whatsappInboundMessage.customerProfile?.username).toBe('@JoeJoe');
	});

	it('accepts user-changed-number system BSUID fields from YCloud samples', () => {
		const parsed = v.parse(incomingMessageSchema, {
			id: 'evt_eEkn26qar3nOB8md',
			type: 'whatsapp.inbound_message.received',
			apiVersion: 'v2',
			createTime: '2023-02-22T12:00:00.000Z',
			whatsappInboundMessage: {
				id: '63f872f6741c165b4342a751',
				wamid: 'wamid.HBgNODi...',
				wabaId: 'WABA-ID',
				from: 'CUSTOMER-PHONE-NUMBER',
				fromUserId: 'US.13491208655302741918',
				fromParentUserId: 'US.11815799212886844830',
				customerProfile: {
					name: 'Joe',
					username: '@JoeJoe'
				},
				to: 'BUSINESS-PHONE-NUMBER',
				sendTime: '2023-02-22T12:00:00.000Z',
				type: 'system',
				system: {
					body: 'User A changed from 18325355831 to 15129984441',
					wa_id: '15129984441',
					user_id: 'US.13491208655302741919',
					parent_user_id: 'US.11815799212886844831',
					type: 'user_changed_number'
				}
			}
		});

		expect(parsed.whatsappInboundMessage.type).toBe('system');
		if (parsed.whatsappInboundMessage.type === 'system') {
			expect(parsed.whatsappInboundMessage.system.user_id).toBe('US.13491208655302741919');
			expect(parsed.whatsappInboundMessage.system.parent_user_id).toBe('US.11815799212886844831');
		}
	});
});
