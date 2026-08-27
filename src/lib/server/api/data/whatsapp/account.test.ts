import { beforeEach, describe, expect, it, vi } from 'vitest';
import { assertWhatsappAccountInOrganizationScope } from './account';

// The scope guard reads via the drizzle query builder; we only need placeholder
// column handles and no-op operators for the where clauses.
vi.mock('$lib/schema/drizzle', () => ({
	whatsappAccount: { id: 'whatsappAccount.id' },
	member: {
		id: 'member.id',
		userId: 'member.userId',
		organizationId: 'member.organizationId'
	}
}));
vi.mock('drizzle-orm', () => ({
	and: vi.fn(),
	eq: vi.fn(),
	isNull: vi.fn()
}));

const organizationId = '11111111-1111-4111-8111-111111111111';
const otherOrganizationId = '22222222-2222-4222-8222-222222222222';
const whatsappAccountId = '33333333-3333-4333-8333-333333333333';
const ownerUserId = '44444444-4444-4444-8444-444444444444';

// Build a fake ServerTransaction whose select().from().where().limit() chain resolves
// to each queued result row-set in turn (first the account lookup, then the membership
// lookup for user-scoped accounts).
function makeTx(resultSets: unknown[][]) {
	let i = 0;
	const chain = {
		from: () => chain,
		where: () => chain,
		limit: () => Promise.resolve(resultSets[i++] ?? [])
	};
	return {
		dbTransaction: { wrappedTransaction: { select: () => chain } }
	} as never;
}

const orgAccount = {
	id: whatsappAccountId,
	scope: 'organization',
	referenceId: organizationId,
	deletedAt: null
};
const userAccount = {
	id: whatsappAccountId,
	scope: 'user',
	referenceId: ownerUserId,
	deletedAt: null
};

describe('assertWhatsappAccountInOrganizationScope', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('accepts an organization-scoped account owned by the organization', async () => {
		const tx = makeTx([[orgAccount]]);
		await expect(
			assertWhatsappAccountInOrganizationScope({ tx, whatsappAccountId, organizationId })
		).resolves.toMatchObject({ id: whatsappAccountId });
	});

	it('rejects an organization-scoped account belonging to another organization', async () => {
		const tx = makeTx([[{ ...orgAccount, referenceId: otherOrganizationId }]]);
		await expect(
			assertWhatsappAccountInOrganizationScope({ tx, whatsappAccountId, organizationId })
		).rejects.toThrow(/does not belong to this organization/);
	});

	it('rejects a soft-deleted (unlinked) account', async () => {
		const tx = makeTx([[{ ...orgAccount, deletedAt: new Date() }]]);
		await expect(
			assertWhatsappAccountInOrganizationScope({ tx, whatsappAccountId, organizationId })
		).rejects.toThrow(/not found or has been unlinked/);
	});

	it('rejects a missing account', async () => {
		const tx = makeTx([[]]);
		await expect(
			assertWhatsappAccountInOrganizationScope({ tx, whatsappAccountId, organizationId })
		).rejects.toThrow(/not found or has been unlinked/);
	});

	it('accepts a user-scoped account whose owner is a member of the organization', async () => {
		const tx = makeTx([[userAccount], [{ id: 'member-row' }]]);
		await expect(
			assertWhatsappAccountInOrganizationScope({ tx, whatsappAccountId, organizationId })
		).resolves.toMatchObject({ id: whatsappAccountId });
	});

	it('rejects a user-scoped account whose owner is not a member of the organization', async () => {
		const tx = makeTx([[userAccount], []]);
		await expect(
			assertWhatsappAccountInOrganizationScope({ tx, whatsappAccountId, organizationId })
		).rejects.toThrow(/owner is not a member of this organization/);
	});
});
