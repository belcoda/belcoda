import { beforeEach, describe, expect, it, vi } from 'vitest';
import { processFlowNodeAction } from './process_flow_node';
import { db, drizzle } from '$lib/server/db';
import { getQueue } from '$lib/server/queue';
import {
	sendWhatsappMessage,
	sendWhatsappTemplateMessage
} from '$lib/server/utils/whatsapp/send_message';
import { convertNodeToFullMessage } from '$lib/server/utils/whatsapp/ycloud/convert_outbound';

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

describe('follow-up node auto-advance', () => {
	const messageNodeId = '66666666-6666-4666-8666-666666666666';
	const followUpNodeId = '77777777-7777-4777-8777-777777777777';
	const buttonId = '88888888-8888-4888-8888-888888888888';
	const tmplNodeId = '99999999-9999-4999-8999-999999999999';
	const tmplId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

	// A message node with an orphaned handleless edge to a follow-up node. Buttons
	// are toggled per-test to exercise both branches.
	function threadWith(buttons: { id: string; label: string }[]) {
		return {
			id: threadId,
			organizationId,
			flow: {
				nodes: [
					{
						id: messageNodeId,
						type: 'message',
						data: { text: 'hi', imageUrl: null, buttons }
					},
					{ id: followUpNodeId, type: 'message', data: { text: 'next', buttons: [] } }
				],
				// Handleless edge: source === messageNodeId, no sourceHandle.
				edges: [{ id: 'orphan', source: messageNodeId, target: followUpNodeId }]
			}
		};
	}

	// A templateMessage source node with an orphaned handleless edge. Template
	// buttons are shaped `{ id }` (no label), which is why process_flow_node reads
	// `data.buttons` defensively rather than assuming the message-node shape.
	function templateThreadWith(buttons: { id: string }[]) {
		return {
			id: threadId,
			organizationId,
			flow: {
				nodes: [
					{ id: tmplNodeId, type: 'templateMessage', data: { templateId: tmplId, buttons } },
					{ id: followUpNodeId, type: 'message', data: { text: 'next', buttons: [] } }
				],
				edges: [{ id: 'orphan', source: tmplNodeId, target: followUpNodeId }]
			}
		};
	}

	let processFlowNodeActionSpy: ReturnType<typeof vi.fn>;

	beforeEach(() => {
		vi.mocked(db.transaction).mockReset();
		vi.mocked(drizzle.query.person.findFirst).mockReset();
		vi.mocked(drizzle.query.whatsappThread.findFirst).mockReset();
		vi.mocked(getQueue).mockReset();
		vi.mocked(sendWhatsappMessage).mockReset();
		vi.mocked(sendWhatsappTemplateMessage).mockReset();
		vi.mocked(convertNodeToFullMessage).mockReturnValue({} as never);
		vi.mocked(drizzle.query.person.findFirst).mockResolvedValue({
			subscribed: true,
			doNotContact: false
		} as never);
		vi.mocked(db.transaction).mockImplementation(async (callback) =>
			callback({} as never, {} as never)
		);
		processFlowNodeActionSpy = vi.fn();
		vi.mocked(getQueue).mockResolvedValue({
			processFlowNodeAction: processFlowNodeActionSpy
		} as never);
	});

	it('does NOT auto-follow a handleless edge from a buttoned message node', async () => {
		vi.mocked(drizzle.query.whatsappThread.findFirst).mockResolvedValue(
			threadWith([{ id: buttonId, label: 'Yes' }]) as never
		);

		await processFlowNodeAction({ nodeId: messageNodeId, personId, organizationId, threadId });

		// The buttoned message is still sent...
		expect(sendWhatsappMessage).toHaveBeenCalledOnce();
		// ...but the orphaned handleless edge must NOT auto-advance the flow.
		expect(processFlowNodeActionSpy).not.toHaveBeenCalled();
	});

	it('does NOT auto-follow a handleless edge from a buttoned templateMessage node', async () => {
		vi.mocked(drizzle.query.whatsappThread.findFirst).mockResolvedValue(
			templateThreadWith([{ id: buttonId }]) as never
		);

		await processFlowNodeAction({ nodeId: tmplNodeId, personId, organizationId, threadId });

		expect(sendWhatsappTemplateMessage).toHaveBeenCalledOnce();
		expect(processFlowNodeActionSpy).not.toHaveBeenCalled();
	});

	it('still auto-follows a handleless edge from a message node with no buttons', async () => {
		vi.mocked(drizzle.query.whatsappThread.findFirst).mockResolvedValue(threadWith([]) as never);

		await processFlowNodeAction({ nodeId: messageNodeId, personId, organizationId, threadId });

		expect(sendWhatsappMessage).toHaveBeenCalledOnce();
		expect(processFlowNodeActionSpy).toHaveBeenCalledWith(
			expect.objectContaining({ nodeId: followUpNodeId })
		);
	});

	it('still auto-follows a handleless edge from a templateMessage node with no buttons', async () => {
		vi.mocked(drizzle.query.whatsappThread.findFirst).mockResolvedValue(
			templateThreadWith([]) as never
		);

		await processFlowNodeAction({ nodeId: tmplNodeId, personId, organizationId, threadId });

		expect(sendWhatsappTemplateMessage).toHaveBeenCalledOnce();
		expect(processFlowNodeActionSpy).toHaveBeenCalledWith(
			expect.objectContaining({ nodeId: followUpNodeId })
		);
	});
});
