import { beforeEach, describe, expect, it, vi } from 'vitest';
import { db } from '$lib/server/db';
import { handleIncomingMessage } from './incoming_message';

vi.mock('$lib/server/db', () => ({
	db: { transaction: vi.fn() }
}));

vi.mock('$lib/schema/drizzle', () => ({
	whatsappThread: {}
}));

vi.mock('$lib/pino', () => ({
	default: () => ({
		debug: vi.fn(),
		error: vi.fn(),
		info: vi.fn(),
		warn: vi.fn()
	})
}));

vi.mock('$lib/server/utils/whatsapp/ycloud/ycloud_api', () => ({
	sendFlowMessage: vi.fn()
}));

vi.mock(
	'$lib/server/queue/handlers/whatsapp/incoming_message_actions/get_details_from_message',
	() => ({ getPersonIdFromButtonAction: vi.fn() })
);

vi.mock('$lib/server/utils/whatsapp/ycloud/convert_outbound', () => ({
	extractButtonActionString: vi.fn()
}));

vi.mock('$lib/server/api/data/person/person', () => ({
	_markPersonUnsubscribedUnsafe: vi.fn(),
	_updateMostRecentWhatsappMessageReceivedAtUnsafe: vi.fn()
}));

vi.mock('$lib/server/api/data/action/check', () => ({
	_getActionCodeUnsafe: vi.fn()
}));

vi.mock('$lib/server/queue', () => ({
	getQueue: vi.fn()
}));

vi.mock('$lib/server/api/data/organization', () => ({
	getOrganizationByIdUnsafe: vi.fn()
}));

vi.mock('$lib/server/api/data/event/event', () => ({
	_getEventByIdUnsafe: vi.fn()
}));

vi.mock('$lib/server/api/data/whatsapp/message', () => ({
	_findWhatsAppMessageByWamidIdUnsafe: vi.fn(),
	createWhatsAppMessage: vi.fn(),
	handleIncomingReaction: vi.fn()
}));

vi.mock('$lib/server/api/data/activity/activity', () => ({
	createActivityWhatsAppMessageIncoming: vi.fn()
}));

vi.mock('$lib/server/api/data/event/signup', () => ({
	attendedEventHelper: vi.fn(),
	completeEventSignupHelper: vi.fn(),
	createIncompleteEventSignupHelper: vi.fn()
}));

vi.mock('$lib/server/api/data/petition/signature', () => ({
	getPetitionByIdUnsafe: vi.fn(),
	createIncompletePetitionSignatureHelper: vi.fn()
}));

vi.mock('$lib/server/queue/handlers/whatsapp/handlers/flow', () => ({
	handleFlowResponse: vi.fn()
}));

vi.mock('$lib/server/api/data/whatsapp/identity', () => ({
	resolveIncomingWhatsappIdentity: vi.fn(),
	upsertWhatsappIdentityForPersonUnsafe: vi.fn()
}));

vi.mock('$lib/server/queue/handlers/whatsapp/incoming_message_actions/convert_incoming', () => ({
	convertIncomingWhatsAppMessage: vi.fn()
}));

vi.mock('$lib/server/api/data/notification/notification', () => ({
	createNotification: vi.fn()
}));

const inboundTextMessage = {
	id: 'evt_stop',
	type: 'whatsapp.inbound_message.received',
	apiVersion: 'v2',
	createTime: '2026-07-24T12:00:00.000Z',
	whatsappInboundMessage: {
		id: 'message_stop',
		wamid: 'wamid.stop',
		wabaId: 'WABA-ID',
		from: '15550000001',
		to: '15550000002',
		sendTime: '2026-07-24T12:00:00.000Z',
		type: 'text',
		text: {
			body: 'STOP'
		}
	}
};

describe('incoming WhatsApp message processing', () => {
	beforeEach(() => {
		vi.mocked(db.transaction).mockReset();
	});

	it('rethrows transaction failures so the queue can retry the message', async () => {
		const transactionError = new Error('transaction failed');
		vi.mocked(db.transaction).mockRejectedValueOnce(transactionError);

		await expect(handleIncomingMessage(inboundTextMessage)).rejects.toBe(transactionError);
	});

	it('acknowledges malformed payloads without starting a transaction', async () => {
		await expect(handleIncomingMessage({ type: 'invalid' })).resolves.toBeUndefined();
		expect(db.transaction).not.toHaveBeenCalled();
	});
});
