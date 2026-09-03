import { beforeEach, describe, expect, it, vi } from 'vitest';

import { updateOrganizationOnboarding } from '$lib/server/api/data/organization';
import { defaultOrganizationSettings } from '$lib/schema/organization/settings';
import { getQueue } from '$lib/server/queue';
import { PgDialect } from 'drizzle-orm/pg-core';
import type { SQL } from 'drizzle-orm';

vi.mock('$lib/server/queue', () => ({
	getQueue: vi.fn(),
	queueSendOptionsFromTransaction: vi.fn(() => ({ tx: true }))
}));

const organizationId = '11111111-1111-4111-8111-111111111111';
const userId = '22222222-2222-4222-8222-222222222222';

function createOrganizationRecord() {
	return {
		id: organizationId,
		name: 'Community Builders',
		slug: 'community-builders',
		logo: null,
		icon: null,
		country: 'KE' as const,
		defaultLanguage: 'en' as const,
		defaultTimezone: 'Africa/Nairobi',
		settings: {
			...defaultOrganizationSettings(),
			theme: {
				...defaultOrganizationSettings().theme,
				primaryColor: '#123456'
			}
		},
		metadata: null,
		balance: 0,
		freeWhatsAppMessageCredits: null,
		freeEmailMessageCredits: null,
		resetFreeQuotasAfter: null,
		plan: null,
		stripeCustomerId: null,
		billingEmail: null,
		createdAt: new Date('2026-01-01T00:00:00.000Z'),
		updatedAt: new Date('2026-01-01T00:00:00.000Z')
	};
}

function createTransaction() {
	const organizationRecord = createOrganizationRecord();
	const findFirst = vi.fn(async () => organizationRecord);
	const returning = vi.fn(async () => [
		{
			...organizationRecord,
			updatedAt: new Date('2026-01-02T00:00:00.000Z')
		}
	]);
	const where = vi.fn(() => ({ returning }));
	const set = vi.fn((values: { settings: SQL }) => {
		void values;
		return { where };
	});
	const update = vi.fn(() => ({ set }));
	const tx = {
		dbTransaction: {
			wrappedTransaction: {
				query: { organization: { findFirst } },
				update
			}
		}
	};

	return { tx, findFirst, update, set };
}

describe('updateOrganizationOnboarding', () => {
	beforeEach(() => {
		vi.mocked(getQueue).mockReset();
		vi.mocked(getQueue).mockResolvedValue({ triggerWebhook: vi.fn() } as never);
	});

	it('authorizes and applies the onboarding patch as an atomic JSONB merge', async () => {
		const { tx, set } = createTransaction();
		const staleClientSettings = defaultOrganizationSettings();
		staleClientSettings.theme.primaryColor = '#abcdef';

		await updateOrganizationOnboarding({
			tx: tx as never,
			ctx: {
				userId,
				authTeams: [],
				adminOrgs: [organizationId],
				ownerOrgs: [],
				otherOrgs: []
			},
			args: {
				metadata: { organizationId, existingSettings: staleClientSettings },
				input: { event: 'complete' }
			}
		});

		const updateValues = set.mock.calls[0]?.[0];
		expect(updateValues).toBeDefined();
		if (!updateValues) throw new Error('Expected organization settings update');
		const query = new PgDialect().sqlToQuery(updateValues.settings);
		expect(query.sql).toContain('"organization"."settings"');
		expect(query.sql).toMatch(/jsonb_build_object\(\s*'onboarding'/);
		expect(query.params).toContain(JSON.stringify({ event: 'complete' }));
		expect(query.params).not.toContain('#abcdef');
	});

	it('does not access or update an organization outside the admin and owner scope', async () => {
		const { tx, findFirst, update } = createTransaction();

		await expect(
			updateOrganizationOnboarding({
				tx: tx as never,
				ctx: {
					userId,
					authTeams: [],
					adminOrgs: [],
					ownerOrgs: [],
					otherOrgs: [organizationId]
				},
				args: {
					metadata: {
						organizationId,
						existingSettings: defaultOrganizationSettings()
					},
					input: { event: 'complete' }
				}
			})
		).rejects.toThrow('not authorized');
		expect(findFirst).not.toHaveBeenCalled();
		expect(update).not.toHaveBeenCalled();
	});
});
