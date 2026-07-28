import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getOrganizationMember } from '$lib/server/api/data/organization/member';
import { getPerson } from '$lib/server/api/data/person/person';
import { notifyConversation } from './notification';

vi.mock('$lib/server/api/data/organization/member', () => ({
	getOrganizationMember: vi.fn()
}));

vi.mock('$lib/server/api/data/person/person', () => ({
	getPerson: vi.fn()
}));

const organizationId = '11111111-1111-4111-8111-111111111111';
const personId = '22222222-2222-4222-8222-222222222222';
const actorUserId = '33333333-3333-4333-8333-333333333333';
const recipientUserId = '44444444-4444-4444-8444-444444444444';
const secondRecipientUserId = '55555555-5555-4555-8555-555555555555';
const requestId = '66666666-6666-4666-8666-666666666666';

function createTx(recipientUserIds: string[]) {
	const returning = vi.fn(async () => [{ id: 'notification-id' }]);
	const onConflictDoNothing = vi.fn(() => ({ returning }));
	const values = vi.fn(() => ({ onConflictDoNothing }));
	const insert = vi.fn(() => ({ values }));
	const select = vi
		.fn()
		.mockReturnValueOnce({
			from: vi.fn(() => ({
				where: vi.fn(async () => recipientUserIds.map((userId) => ({ userId })))
			}))
		})
		.mockReturnValueOnce({
			from: vi.fn(() => ({
				where: vi.fn(() => ({
					limit: vi.fn(async () => [{ name: 'Alex Agent' }])
				}))
			}))
		});
	const tx = {
		dbTransaction: {
			wrappedTransaction: {
				select,
				insert
			}
		}
	};

	return { tx, insert, values };
}

function args(recipientUserIds: string[]) {
	return {
		input: { recipientUserIds },
		metadata: { organizationId, personId, requestId }
	};
}

const ctx = {
	userId: actorUserId,
	authTeams: [],
	adminOrgs: [organizationId],
	ownerOrgs: [],
	otherOrgs: []
};

describe('notifyConversation', () => {
	beforeEach(() => {
		vi.mocked(getOrganizationMember).mockReset();
		vi.mocked(getPerson).mockReset();
		vi.mocked(getOrganizationMember).mockResolvedValue({} as never);
		vi.mocked(getPerson).mockResolvedValue({
			givenName: 'Yusra',
			familyName: 'Parks',
			phoneNumber: null
		} as never);
	});

	it('notifies unique organization members and excludes the sender', async () => {
		const { tx, values } = createTx([recipientUserId, secondRecipientUserId]);

		await notifyConversation({
			tx: tx as never,
			ctx,
			args: args([actorUserId, recipientUserId, recipientUserId, secondRecipientUserId])
		});

		expect(values).toHaveBeenCalledWith([
			expect.objectContaining({
				userId: recipientUserId,
				type: 'conversation_mention',
				referenceId: personId,
				sourceKey: `conversation_mention:${requestId}`,
				payload: {
					actorName: 'Alex Agent',
					personId,
					personName: 'Yusra Parks'
				}
			}),
			expect.objectContaining({
				userId: secondRecipientUserId,
				type: 'conversation_mention'
			})
		]);
	});

	it('rejects recipients who are not organization members', async () => {
		const { tx, insert } = createTx([recipientUserId]);

		await expect(
			notifyConversation({
				tx: tx as never,
				ctx,
				args: args([recipientUserId, secondRecipientUserId])
			})
		).rejects.toThrow('All recipients must be organization members');

		expect(insert).not.toHaveBeenCalled();
	});
});
