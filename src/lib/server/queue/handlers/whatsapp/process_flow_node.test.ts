import { beforeEach, describe, expect, it, vi } from 'vitest';
import { processFlowNodeAction } from './process_flow_node';
import { db, drizzle } from '$lib/server/db';
import { getQueue } from '$lib/server/queue';
import {
	sendWhatsappMessage,
	sendWhatsappTemplateMessage
} from '$lib/server/utils/whatsapp/send_message';

vi.mock('$lib/server/db', () => ({
	db: {
		transaction: vi.fn()
	},
	drizzle: {
		query: {
			person: { findFirst: vi.fn() },
			whatsappThread: { findFirst: vi.fn() }
		}
	}
}));

vi.mock('$lib/schema/drizzle', () => ({
	person: {
		id: 'person.id',
		organizationId: 'person.organizationId',
		deletedAt: 'person.deletedAt'
	},
	whatsappThread: {
		id: 'whatsappThread.id',
		organizationId: 'whatsappThread.organizationId'
	}
}));

vi.mock('drizzle-orm', () => ({
	and: vi.fn(),
	eq: vi.fn(),
	isNull: vi.fn()
}));

vi.mock('$lib/server/queue', () => ({
	getQueue: vi.fn()
}));

vi.mock('$lib/server/api/data/person/tag', () => ({
	_addPersonTagData: vi.fn()
}));

vi.mock('$lib/server/api/data/person/team', () => ({
	_addPersonTeamDataUnsafe: vi.fn()
}));

vi.mock('$lib/server/api/data/event/signup', () => ({
	signUpForEventWithId: vi.fn()
}));

vi.mock('$lib/server/api/data/petition/signature', () => ({
	signPetitionWithId: vi.fn()
}));

vi.mock('$lib/server/utils/whatsapp/send_message', () => ({
	sendWhatsappMessage: vi.fn(),
	sendWhatsappTemplateMessage: vi.fn()
}));

vi.mock('$lib/server/utils/whatsapp/ycloud/convert_outbound', () => ({
	convertNodeToFullMessage: vi.fn()
}));

vi.mock('$lib/pino', () => ({
	default: () => ({ info: vi.fn() })
}));

const organizationId = '11111111-1111-4111-8111-111111111111';
const threadId = '22222222-2222-4222-8222-222222222222';
const templateNodeId = '33333333-3333-4333-8333-333333333333';
const personId = '44444444-4444-4444-8444-444444444444';
const templateId = '55555555-5555-4555-8555-555555555555';

const thread = {
	id: threadId,
	organizationId,
	flow: {
		nodes: [
			{
				id: templateNodeId,
				type: 'templateMessage',
				data: { templateId }
			}
		],
		edges: []
	}
};

describe('queued WhatsApp flow messages', () => {
	beforeEach(() => {
		vi.mocked(db.transaction).mockReset();
		vi.mocked(drizzle.query.person.findFirst).mockReset();
		vi.mocked(drizzle.query.whatsappThread.findFirst).mockReset();
		vi.mocked(getQueue).mockReset();
		vi.mocked(sendWhatsappMessage).mockReset();
		vi.mocked(sendWhatsappTemplateMessage).mockReset();
		vi.mocked(drizzle.query.whatsappThread.findFirst).mockResolvedValue(thread as never);
	});

	it('skips an interactive message when the person is do not contact', async () => {
		vi.mocked(drizzle.query.person.findFirst).mockResolvedValueOnce({
			subscribed: true,
			doNotContact: true
		} as never);

		await processFlowNodeAction({
			nodeId: templateNodeId,
			personId,
			organizationId,
			threadId,
			enforceSubscription: false
		});

		expect(sendWhatsappTemplateMessage).not.toHaveBeenCalled();
		expect(db.transaction).not.toHaveBeenCalled();
		expect(getQueue).not.toHaveBeenCalled();
	});

	it('sends the queued message when the person remains eligible', async () => {
		vi.mocked(drizzle.query.person.findFirst).mockResolvedValueOnce({
			subscribed: true,
			doNotContact: false
		} as never);
		vi.mocked(db.transaction).mockImplementationOnce(async (callback) =>
			callback({} as never, {} as never)
		);

		await processFlowNodeAction({
			nodeId: templateNodeId,
			personId,
			organizationId,
			threadId
		});

		expect(sendWhatsappTemplateMessage).toHaveBeenCalledWith({
			message: { templateId },
			personId,
			organizationId,
			threadId,
			nodeId: templateNodeId,
			templateId
		});
	});

	it('skips an already-queued broadcast when the person has unsubscribed', async () => {
		vi.mocked(drizzle.query.person.findFirst).mockResolvedValueOnce({
			subscribed: false,
			doNotContact: false
		} as never);

		await processFlowNodeAction({
			nodeId: templateNodeId,
			personId,
			organizationId,
			threadId,
			enforceSubscription: true
		});

		expect(sendWhatsappTemplateMessage).not.toHaveBeenCalled();
		expect(db.transaction).not.toHaveBeenCalled();
	});

	it('allows an interactive flow response when the person has unsubscribed', async () => {
		vi.mocked(drizzle.query.person.findFirst).mockResolvedValueOnce({
			subscribed: false,
			doNotContact: false
		} as never);
		vi.mocked(db.transaction).mockImplementationOnce(async (callback) =>
			callback({} as never, {} as never)
		);

		await processFlowNodeAction({
			nodeId: templateNodeId,
			personId,
			organizationId,
			threadId,
			enforceSubscription: false
		});

		expect(sendWhatsappTemplateMessage).toHaveBeenCalledOnce();
	});
});
