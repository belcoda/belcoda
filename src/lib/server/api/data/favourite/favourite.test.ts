import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getOrganizationMember } from '$lib/server/api/data/organization/member';
import { addFavourite, removeFavourite } from './favourite';

vi.mock('$lib/server/api/data/organization/member', () => ({
	getOrganizationMember: vi.fn()
}));

const favouriteId = '11111111-1111-4111-8111-111111111111';
const organizationId = '22222222-2222-4222-8222-222222222222';
const memberId = '33333333-3333-4333-8333-333333333333';
const userId = '44444444-4444-4444-8444-444444444444';
const referenceId = '55555555-5555-4555-8555-555555555555';

const ctx = {
	userId,
	authTeams: [],
	adminOrgs: [organizationId],
	ownerOrgs: [],
	otherOrgs: []
};

const metadata = {
	favouriteId,
	organizationId,
	memberId,
	referenceType: 'person' as const,
	referenceId
};

function createTransaction({
	insertedRows = [],
	existingRow,
	removedRows = []
}: {
	insertedRows?: unknown[];
	existingRow?: unknown;
	removedRows?: unknown[];
} = {}) {
	const insertReturning = vi.fn().mockResolvedValue(insertedRows);
	const onConflictDoNothing = vi.fn(() => ({ returning: insertReturning }));
	const values = vi.fn(() => ({ onConflictDoNothing }));
	const insert = vi.fn(() => ({ values }));

	const deleteReturning = vi.fn().mockResolvedValue(removedRows);
	const where = vi.fn(() => ({ returning: deleteReturning }));
	const deleteRow = vi.fn(() => ({ where }));

	const findFirst = vi.fn().mockResolvedValue(existingRow);
	const run = vi.fn().mockResolvedValue({ id: referenceId, organizationId });

	const tx = {
		location: 'server',
		run,
		dbTransaction: {
			wrappedTransaction: {
				insert,
				delete: deleteRow,
				query: {
					memberFavourite: { findFirst }
				}
			}
		}
	};

	return { tx, run, values, onConflictDoNothing, findFirst, deleteRow };
}

describe('member favourites', () => {
	beforeEach(() => {
		vi.mocked(getOrganizationMember).mockReset();
		vi.mocked(getOrganizationMember).mockResolvedValue({
			id: memberId,
			organizationId,
			userId
		} as never);
	});

	it.each(['person', 'event', 'petition'] as const)(
		'adds a favourite for a readable %s',
		async (referenceType) => {
			const inserted = {
				id: favouriteId,
				organizationId,
				memberId,
				referenceType,
				referenceId
			};
			const { tx, values, run } = createTransaction({ insertedRows: [inserted] });

			const result = await addFavourite({
				tx: tx as never,
				ctx,
				args: { metadata: { ...metadata, referenceType } }
			});

			expect(run).toHaveBeenCalledOnce();
			expect(values).toHaveBeenCalledWith({
				id: favouriteId,
				organizationId,
				memberId,
				referenceType,
				referenceId,
				createdAt: expect.any(Date)
			});
			expect(result).toBe(inserted);
		}
	);

	it('returns the existing row when the favourite already exists', async () => {
		const existing = {
			id: '66666666-6666-4666-8666-666666666666',
			organizationId,
			memberId,
			referenceType: 'person',
			referenceId
		};
		const { tx, onConflictDoNothing, findFirst } = createTransaction({ existingRow: existing });

		const result = await addFavourite({
			tx: tx as never,
			ctx,
			args: { metadata }
		});

		expect(onConflictDoNothing).toHaveBeenCalledWith();
		expect(findFirst).toHaveBeenCalledOnce();
		expect(result).toBe(existing);
	});

	it('rejects a member id that does not belong to the authenticated user', async () => {
		const { tx, run } = createTransaction();

		await expect(
			addFavourite({
				tx: tx as never,
				ctx,
				args: {
					metadata: {
						...metadata,
						memberId: '77777777-7777-4777-8777-777777777777'
					}
				}
			})
		).rejects.toThrow('Member does not match the authenticated user');
		expect(run).not.toHaveBeenCalled();
	});

	it.each(['person', 'event', 'petition'] as const)(
		'rejects an unreadable %s reference',
		async (referenceType) => {
			const { tx, run } = createTransaction();
			run.mockResolvedValueOnce(undefined);

			await expect(
				addFavourite({
					tx: tx as never,
					ctx,
					args: { metadata: { ...metadata, referenceType } }
				})
			).rejects.toThrow('Favourite reference not found');
		}
	);

	it('removes a favourite idempotently', async () => {
		const { tx, deleteRow } = createTransaction();

		const result = await removeFavourite({
			tx: tx as never,
			ctx,
			args: { metadata }
		});

		expect(deleteRow).toHaveBeenCalledOnce();
		expect(result).toBeNull();
	});
});
