import { beforeEach, describe, expect, it, vi } from 'vitest';
import { processFlowNodeWhatsappSendMessage } from './send_message';
import { db } from '$lib/server/db';
import { _getFlowDetailsUnsafe } from '$lib/server/api/data/flow/utils';
import { _updateFlowExecutionStep } from '$lib/server/api/data/flow/execution_step';
import { queueNextNode } from '$lib/server/queue/handlers/flow/node/utils/queue_next_node';
import { shouldSkipPersonMessage } from '$lib/server/queue/handlers/whatsapp/process_flow_node';
import { sendWhatsappMessage } from '$lib/server/utils/whatsapp/linkeddevice/send_message';

vi.mock('$lib/server/db', () => ({
	db: { transaction: vi.fn() }
}));
vi.mock('$lib/server/api/data/flow/utils', () => ({
	_getFlowDetailsUnsafe: vi.fn()
}));
vi.mock('$lib/server/api/data/flow/execution_step', () => ({
	_updateFlowExecutionStep: vi.fn()
}));
vi.mock('$lib/server/queue/handlers/flow/node/utils/queue_next_node', () => ({
	queueNextNode: vi.fn()
}));
vi.mock('$lib/server/queue/handlers/whatsapp/process_flow_node', () => ({
	shouldSkipPersonMessage: vi.fn()
}));
vi.mock('$lib/server/utils/whatsapp/linkeddevice/send_message', () => ({
	sendWhatsappMessage: vi.fn()
}));
vi.mock('$lib/pino', () => ({
	default: () => ({ info: vi.fn() })
}));

const flowVersionId = '11111111-1111-4111-8111-111111111111';
const personId = '22222222-2222-4222-8222-222222222222';
const organizationId = '33333333-3333-4333-8333-333333333333';
const flowExecutionId = '44444444-4444-4444-8444-444444444444';
const flowExecutionStepId = '55555555-5555-4555-8555-555555555555';
const nodeId = '66666666-6666-4666-8666-666666666666';
const whatsappAccountId = '77777777-7777-4777-8777-777777777777';

const flowDefinition = { nodes: [], edges: [] };
const flowDetails = {
	node: {
		data: {
			type: 'whatsapp.sendMessage',
			message: { body: 'hello' },
			whatsappAccountId
		}
	},
	flowVersion: { flowDefinition }
};

const props = {
	flowVersionId,
	personId,
	organizationId,
	flowExecutionId,
	flowExecutionStepId,
	nodeId
};

describe('processFlowNodeWhatsappSendMessage', () => {
	beforeEach(() => {
		vi.mocked(db.transaction).mockReset();
		vi.mocked(_getFlowDetailsUnsafe).mockReset();
		vi.mocked(_updateFlowExecutionStep).mockReset();
		vi.mocked(queueNextNode).mockReset();
		vi.mocked(shouldSkipPersonMessage).mockReset();
		vi.mocked(sendWhatsappMessage).mockReset();

		vi.mocked(_getFlowDetailsUnsafe).mockResolvedValue(flowDetails as never);
		//@ts-expect-error - mock implementation
		vi.mocked(db.transaction).mockImplementation(async (callback: (tx: never) => unknown) =>
			callback({} as never)
		);
	});

	it('advances the flow when the recipient is ineligible instead of leaving it running', async () => {
		vi.mocked(shouldSkipPersonMessage).mockResolvedValue(true);

		await processFlowNodeWhatsappSendMessage(props);

		// nothing sent, but the step completes and the flow is advanced (queueNextNode
		// completes the execution when this was the terminal node) — otherwise the
		// execution would stay 'running' forever.
		expect(sendWhatsappMessage).not.toHaveBeenCalled();
		expect(_updateFlowExecutionStep).toHaveBeenCalledWith(
			expect.objectContaining({ flowExecutionStepId, status: 'completed' })
		);
		expect(queueNextNode).toHaveBeenCalledWith(
			expect.objectContaining({
				flowVersionId,
				personId,
				organizationId,
				flowExecutionId,
				nodeId,
				flow: flowDefinition
			})
		);
	});

	it('sends the message and advances the flow when the recipient is eligible', async () => {
		vi.mocked(shouldSkipPersonMessage).mockResolvedValue(false);

		await processFlowNodeWhatsappSendMessage(props);

		expect(sendWhatsappMessage).toHaveBeenCalledOnce();
		expect(_updateFlowExecutionStep).toHaveBeenCalledWith(
			expect.objectContaining({ flowExecutionStepId, status: 'completed' })
		);
		expect(queueNextNode).toHaveBeenCalledOnce();
	});
});
