import { beforeEach, describe, expect, it, vi } from 'vitest';
import { buildWhatsappThreadSendQueue } from './build_send_queue';
import { getPersonRecordsFromFilter } from '$lib/server/api/data/person/filter';
import { getQueue } from '$lib/server/queue/index';
import { db } from '$lib/server/db';

vi.mock('$lib/server/api/data/person/filter', () => ({
	getPersonRecordsFromFilter: vi.fn()
}));

vi.mock('$lib/server/queue/index', () => ({
	getQueue: vi.fn()
}));

vi.mock('$lib/server/db', () => ({
	db: {
		transaction: vi.fn()
	}
}));

vi.mock('$lib/pino', () => ({
	default: () => ({ info: vi.fn() })
}));

const organizationId = '11111111-1111-4111-8111-111111111111';
const threadId = '22222222-2222-4222-8222-222222222222';
const templateNodeId = '33333333-3333-4333-8333-333333333333';
const unsubscribedPersonId = '44444444-4444-4444-8444-444444444444';
const doNotContactPersonId = '55555555-5555-4555-8555-555555555555';
const eligiblePersonId = '66666666-6666-4666-8666-666666666666';

describe('WhatsApp broadcast queue construction', () => {
	beforeEach(() => {
		vi.mocked(db.transaction).mockReset();
		vi.mocked(getPersonRecordsFromFilter).mockReset();
		vi.mocked(getQueue).mockReset();
	});

	it('does not enqueue unsubscribed or do-not-contact recipients', async () => {
		vi.mocked(getPersonRecordsFromFilter).mockResolvedValueOnce([
			{
				id: unsubscribedPersonId,
				phoneNumber: '+15550000001',
				subscribed: false,
				doNotContact: false
			},
			{
				id: doNotContactPersonId,
				phoneNumber: '+15550000002',
				subscribed: true,
				doNotContact: true
			},
			{
				id: eligiblePersonId,
				phoneNumber: '+15550000003',
				subscribed: true,
				doNotContact: false
			}
		] as never);
		vi.mocked(db.transaction)
			.mockImplementationOnce(async (callback) => callback({} as never, {} as never))
			.mockResolvedValueOnce([] as never);

		const processFlowNodeAction = vi.fn();
		vi.mocked(getQueue).mockResolvedValueOnce({ processFlowNodeAction } as never);

		await buildWhatsappThreadSendQueue({
			thread: {
				id: threadId,
				organizationId,
				flow: {
					nodes: [
						{
							id: '77777777-7777-4777-8777-777777777777',
							type: 'targeting',
							data: { filter: { type: 'and', filters: [], exclude: [] } }
						},
						{
							id: templateNodeId,
							type: 'templateMessage',
							data: { templateId: '88888888-8888-4888-8888-888888888888' }
						}
					],
					edges: []
				}
			} as never
		});

		expect(processFlowNodeAction).toHaveBeenCalledOnce();
		expect(processFlowNodeAction).toHaveBeenCalledWith({
			nodeId: templateNodeId,
			personId: eligiblePersonId,
			organizationId,
			threadId
		});
		expect(processFlowNodeAction).not.toHaveBeenCalledWith(
			expect.objectContaining({ personId: unsubscribedPersonId })
		);
		expect(processFlowNodeAction).not.toHaveBeenCalledWith(
			expect.objectContaining({ personId: doNotContactPersonId })
		);
	});
});
