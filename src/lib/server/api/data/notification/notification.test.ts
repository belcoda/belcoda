import { describe, expect, it, vi } from 'vitest';

import { memberFavourite } from '$lib/schema/drizzle';
import { resolveNotificationRecipients } from './notification';

const organizationId = '11111111-1111-4111-8111-111111111111';
const explicitUserId = '22222222-2222-4222-8222-222222222222';
const favouriteUserId = '33333333-3333-4333-8333-333333333333';
const adminUserId = '44444444-4444-4444-8444-444444444444';
const otherMemberUserId = '55555555-5555-4555-8555-555555555555';
const personId = '66666666-6666-4666-8666-666666666666';
const eventId = '77777777-7777-4777-8777-777777777777';

function createTransaction({
	favouriteMemberships = [],
	memberQueryResults = []
}: {
	favouriteMemberships?: { userId: string }[];
	memberQueryResults?: { userId: string }[][];
} = {}) {
	let memberQueryIndex = 0;
	const favouriteWhere = vi.fn().mockResolvedValue(favouriteMemberships);
	const innerJoin = vi.fn(() => ({ where: favouriteWhere }));
	const memberWhere = vi.fn(() => {
		const result = memberQueryResults[memberQueryIndex++] ?? [];
		return Object.assign(Promise.resolve(result), {
			limit: vi.fn().mockResolvedValue(result.slice(0, 1))
		});
	});
	const from = vi.fn((table) => {
		if (table === memberFavourite) {
			return { innerJoin };
		}
		return { where: memberWhere };
	});
	const select = vi.fn(() => ({ from }));

	return {
		tx: {
			dbTransaction: {
				wrappedTransaction: { select }
			}
		},
		select,
		favouriteWhere
	};
}

describe('notification recipient routing', () => {
	it('keeps existing explicit routing unchanged when there are no related resources', async () => {
		const { tx, select } = createTransaction();

		const recipients = await resolveNotificationRecipients({
			tx: tx as never,
			organizationId,
			recipientUserIds: [explicitUserId, explicitUserId],
			creatorUserId: null
		});

		expect(recipients).toEqual([explicitUserId]);
		expect(select).not.toHaveBeenCalled();
	});

	it('extends explicit routing with members who favourited any related resource', async () => {
		const { tx, favouriteWhere } = createTransaction({
			favouriteMemberships: [{ userId: favouriteUserId }, { userId: explicitUserId }]
		});

		const recipients = await resolveNotificationRecipients({
			tx: tx as never,
			organizationId,
			recipientUserIds: [explicitUserId],
			creatorUserId: null,
			relatedResources: [
				{ referenceType: 'event', referenceId: eventId },
				{ referenceType: 'person', referenceId: personId }
			]
		});

		expect(favouriteWhere).toHaveBeenCalledOnce();
		expect(recipients).toEqual([explicitUserId, favouriteUserId]);
	});

	it('extends the admin fallback without replacing it', async () => {
		const { tx } = createTransaction({
			favouriteMemberships: [{ userId: favouriteUserId }],
			memberQueryResults: [
				[{ userId: adminUserId }, { userId: otherMemberUserId }],
				[{ userId: adminUserId }]
			]
		});

		const recipients = await resolveNotificationRecipients({
			tx: tx as never,
			organizationId,
			recipientUserIds: undefined,
			creatorUserId: null,
			relatedResources: [{ referenceType: 'person', referenceId: personId }]
		});

		expect(recipients).toEqual([adminUserId, favouriteUserId]);
	});
});
