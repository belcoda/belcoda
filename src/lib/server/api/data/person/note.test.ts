import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getQueue } from '$lib/server/queue';
import { _updatePersonNoteNoPermissionsCheckUnsafe } from './note';

vi.mock('$lib/server/queue', () => ({
	getQueue: vi.fn(),
	queueSendOptionsFromTransaction: vi.fn(() => ({ tx: true }))
}));

const noteId = '11111111-1111-4111-8111-111111111111';
const personId = '22222222-2222-4222-8222-222222222222';
const organizationId = '33333333-3333-4333-8333-333333333333';
const userId = '44444444-4444-4444-8444-444444444444';

function createTransaction() {
	const updatedNote = {
		id: noteId,
		personId,
		organizationId,
		note: 'Updated note text',
		userId,
		createdAt: new Date('2026-01-01T00:00:00.000Z'),
		updatedAt: new Date('2026-01-01T00:00:00.000Z'),
		deletedAt: null
	};
	const returning = vi.fn().mockResolvedValue([updatedNote]);
	const where = vi.fn(() => ({ returning }));
	const set = vi.fn(() => ({ where }));
	const update = vi.fn(() => ({ set }));

	const deleteWhere = vi.fn().mockResolvedValue(undefined);
	const deleteRows = vi.fn(() => ({ where: deleteWhere }));

	const insertValues = vi.fn().mockResolvedValue(undefined);
	const insertRows = vi.fn(() => ({ values: insertValues }));

	const tx = {
		location: 'server',
		dbTransaction: {
			wrappedTransaction: {
				update,
				delete: deleteRows,
				insert: insertRows
			}
		}
	};

	return { tx, deleteWhere, insertValues };
}

describe('person note mention updates', () => {
	beforeEach(() => {
		vi.mocked(getQueue).mockReset();
	});

	it('clears existing mentions when an update omits mention spans', async () => {
		const { tx, deleteWhere, insertValues } = createTransaction();
		const triggerWebhook = vi.fn();
		vi.mocked(getQueue).mockResolvedValueOnce({ triggerWebhook } as never);

		await _updatePersonNoteNoPermissionsCheckUnsafe({
			tx: tx as never,
			noteId,
			personId,
			organizationId,
			note: 'No spans provided'
		});

		expect(deleteWhere).toHaveBeenCalledOnce();
		expect(insertValues).not.toHaveBeenCalled();
		expect(triggerWebhook).toHaveBeenCalledOnce();
	});

	it('replaces mentions when explicit spans are provided', async () => {
		const { tx, deleteWhere, insertValues } = createTransaction();
		const triggerWebhook = vi.fn();
		vi.mocked(getQueue).mockResolvedValueOnce({ triggerWebhook } as never);

		await _updatePersonNoteNoPermissionsCheckUnsafe({
			tx: tx as never,
			noteId,
			personId,
			organizationId,
			note: 'Hi @Alex',
			mentions: [
				{
					id: '55555555-5555-4555-8555-555555555555',
					mentionedUserId: '66666666-6666-4666-8666-666666666666',
					startIndex: 3,
					length: 5
				}
			]
		});

		expect(deleteWhere).toHaveBeenCalledOnce();
		expect(insertValues).toHaveBeenCalledWith([
			expect.objectContaining({
				mentionedUserId: '66666666-6666-4666-8666-666666666666',
				personNoteId: noteId,
				startIndex: 3,
				length: 5,
				createdAt: expect.any(Date)
			})
		]);
		expect(triggerWebhook).toHaveBeenCalledOnce();
	});
});
