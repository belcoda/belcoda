import { beforeEach, describe, expect, it, vi } from 'vitest';

import { updatePeopleSidebarSettings } from './member';

const organizationId = '11111111-1111-4111-8111-111111111111';
const userId = '22222222-2222-4222-8222-222222222222';
const memberId = '33333333-3333-4333-8333-333333333333';

function createTransaction(returnedSettings?: unknown) {
	const returning = vi
		.fn()
		.mockResolvedValue(returnedSettings === undefined ? [] : [{ settings: returnedSettings }]);
	const where = vi.fn(() => ({ returning }));
	const set = vi.fn(() => ({ where }));
	const update = vi.fn(() => ({ set }));
	const findFirst = vi.fn().mockResolvedValue({
		id: memberId,
		organizationId,
		userId,
		settings: null
	});

	return {
		tx: {
			location: 'server',
			dbTransaction: {
				wrappedTransaction: {
					update,
					query: { member: { findFirst } }
				}
			}
		},
		findFirst,
		set
	};
}

describe('people sidebar member settings', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('updates the authenticated organization membership preference', async () => {
		const { tx, findFirst, set } = createTransaction({
			sidebar: { prioritizePeopleFavourites: false }
		});

		const result = await updatePeopleSidebarSettings({
			tx: tx as never,
			ctx: {
				userId,
				authTeams: [],
				adminOrgs: [],
				ownerOrgs: [],
				otherOrgs: [organizationId]
			},
			args: {
				metadata: { organizationId },
				input: { prioritizePeopleFavourites: false }
			}
		});

		expect(findFirst).toHaveBeenCalledOnce();
		expect(set).toHaveBeenCalledOnce();
		expect(result.sidebar.prioritizePeopleFavourites).toBe(false);
	});

	it('fails when the membership update does not return a row', async () => {
		const { tx } = createTransaction();

		await expect(
			updatePeopleSidebarSettings({
				tx: tx as never,
				ctx: {
					userId,
					authTeams: [],
					adminOrgs: [],
					ownerOrgs: [],
					otherOrgs: [organizationId]
				},
				args: {
					metadata: { organizationId },
					input: { prioritizePeopleFavourites: true }
				}
			})
		).rejects.toThrow('Failed to update people sidebar settings');
	});
});
