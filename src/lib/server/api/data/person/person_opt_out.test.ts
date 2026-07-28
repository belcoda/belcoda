import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getQueue } from '$lib/server/queue';
import { _markPersonUnsubscribedUnsafe } from './person';

vi.mock('$lib/server/queue', () => ({
	getQueue: vi.fn(),
	queueSendOptionsFromTransaction: vi.fn(() => ({ tx: true }))
}));

vi.mock('$lib/pino', () => ({
	default: () => ({
		error: vi.fn(),
		warn: vi.fn()
	})
}));

vi.mock('valibot', async (importOriginal) => {
	const actual = await importOriginal<typeof import('valibot')>();
	return {
		...actual,
		parse: vi.fn((_schema, input) => input)
	};
});

const personId = '11111111-1111-4111-8111-111111111111';
const organizationId = '22222222-2222-4222-8222-222222222222';

function createTransaction(returnedRows: unknown[]) {
	const returning = vi.fn().mockResolvedValue(returnedRows);
	const where = vi.fn(() => ({ returning }));
	const set = vi.fn((_values: unknown) => ({ where }));
	const update = vi.fn(() => ({ set }));
	const tx = {
		dbTransaction: {
			wrappedTransaction: {
				update
			}
		}
	};

	return { tx, set };
}

describe('WhatsApp person opt-out updates', () => {
	beforeEach(() => {
		vi.mocked(getQueue).mockReset();
	});

	it('emits person.updated when the preference changes', async () => {
		const updatedPerson = {
			id: personId,
			organizationId,
			subscribed: false,
			doNotContact: false
		};
		const { tx, set } = createTransaction([updatedPerson]);
		const triggerWebhook = vi.fn();
		vi.mocked(getQueue).mockResolvedValueOnce({ triggerWebhook } as never);

		const changed = await _markPersonUnsubscribedUnsafe({
			tx: tx as never,
			args: { personId, organizationId }
		});

		expect(changed).toBe(true);
		expect(set).toHaveBeenCalledWith(
			expect.objectContaining({
				subscribed: false,
				updatedAt: expect.any(Date)
			})
		);
		expect(set.mock.calls[0][0]).not.toHaveProperty('doNotContact');
		expect(triggerWebhook).toHaveBeenCalledWith(
			{
				organizationId,
				payload: {
					type: 'person.updated',
					data: updatedPerson
				}
			},
			{ tx: true }
		);
	});

	it('does not emit another webhook when the person is already unsubscribed', async () => {
		const { tx } = createTransaction([]);

		const changed = await _markPersonUnsubscribedUnsafe({
			tx: tx as never,
			args: { personId, organizationId }
		});

		expect(changed).toBe(false);
		expect(getQueue).not.toHaveBeenCalled();
	});

	it('keeps the opt-out when webhook enqueueing fails', async () => {
		const { tx } = createTransaction([{ id: personId, organizationId, subscribed: false }]);
		vi.mocked(getQueue).mockRejectedValueOnce(new Error('queue unavailable'));

		const changed = await _markPersonUnsubscribedUnsafe({
			tx: tx as never,
			args: { personId, organizationId }
		});

		expect(changed).toBe(true);
	});
});
