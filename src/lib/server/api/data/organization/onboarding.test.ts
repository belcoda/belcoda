import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
	updateOrganizationOnboarding,
	updateOrganizationProfileOnboarding,
	updateOrganizationWhatsappSettings
} from '$lib/server/api/data/organization';
import { bindPhoneNumberToWaba } from '$lib/server/utils/whatsapp/ycloud/ycloud_api';
import {
	defaultOrganizationOnboardingSettings,
	defaultOrganizationSettings
} from '$lib/schema/organization/settings';
import { getQueue } from '$lib/server/queue';
import { PgDialect } from 'drizzle-orm/pg-core';
import type { SQL } from 'drizzle-orm';

vi.mock('$lib/server/queue', () => ({
	getQueue: vi.fn(),
	queueSendOptionsFromTransaction: vi.fn(() => ({ tx: true }))
}));

vi.mock('$lib/server/utils/whatsapp/ycloud/ycloud_api', () => ({
	bindPhoneNumberToWaba: vi.fn()
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
		vi.mocked(bindPhoneNumberToWaba).mockReset();
		vi.mocked(getQueue).mockReset();
		vi.mocked(getQueue).mockResolvedValue({ triggerWebhook: vi.fn() } as never);
	});

	it('saves a confirmed WhatsApp connection and onboarding completion together', async () => {
		const { tx, set } = createTransaction();
		vi.mocked(bindPhoneNumberToWaba).mockResolvedValue('+254712345678');
		await updateOrganizationWhatsappSettings({
			tx: tx as never,
			ctx: { userId, authTeams: [], adminOrgs: [organizationId], ownerOrgs: [], otherOrgs: [] },
			args: {
				metadata: { organizationId },
				input: { number: '123456789', wabaId: '987654321' }
			}
		});
		expect(set).toHaveBeenCalledTimes(1);
		const query = new PgDialect().sqlToQuery(set.mock.calls[0][0].settings);
		expect(query.params.map((value) => JSON.parse(String(value)))).toEqual(
			expect.arrayContaining([
				expect.objectContaining({ number: '+254712345678', wabaId: '987654321' })
			])
		);
		expect(query.params).toContain(JSON.stringify({ whatsappAccount: 'complete' }));
		expect(query.params).toContain(
			JSON.stringify(defaultOrganizationOnboardingSettings('complete'))
		);
		expect(query.sql).toContain('COALESCE("organization"."settings"->\'onboarding\'');
	});

	it('saves profile defaults and onboarding completion together', async () => {
		const { tx, set } = createTransaction();
		await updateOrganizationProfileOnboarding({
			tx: tx as never,
			ctx: { userId, authTeams: [], adminOrgs: [organizationId], ownerOrgs: [], otherOrgs: [] },
			args: {
				metadata: { organizationId, existingSettings: defaultOrganizationSettings() },
				input: {
					country: 'US',
					defaultLanguage: 'en',
					defaultTimezone: 'America/New_York'
				}
			}
		});

		expect(set).toHaveBeenCalledTimes(1);
		expect(set.mock.calls[0][0]).toEqual(
			expect.objectContaining({
				country: 'US',
				defaultLanguage: 'en',
				defaultTimezone: 'America/New_York'
			})
		);
		const query = new PgDialect().sqlToQuery(set.mock.calls[0][0].settings);
		expect(query.params).toContain(
			JSON.stringify({ initialSetup: 'complete', profile: 'complete' })
		);
	});

	it('does not save a connection or mark onboarding complete when binding fails', async () => {
		const { tx, update } = createTransaction();
		vi.mocked(bindPhoneNumberToWaba).mockRejectedValue(new Error('Connection rejected'));
		await expect(
			updateOrganizationWhatsappSettings({
				tx: tx as never,
				ctx: { userId, authTeams: [], adminOrgs: [organizationId], ownerOrgs: [], otherOrgs: [] },
				args: {
					metadata: { organizationId },
					input: { number: '123456789', wabaId: '987654321' }
				}
			})
		).rejects.toThrow('Connection rejected');
		expect(update).not.toHaveBeenCalled();
	});

	it('preserves unrelated settings while atomically applying the onboarding patch', async () => {
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
				input: { initialSetup: 'skipped', whatsappAccount: 'not_needed' }
			}
		});

		const updateValues = set.mock.calls[0]?.[0];
		expect(updateValues).toBeDefined();
		if (!updateValues) throw new Error('Expected organization settings update');
		const query = new PgDialect().sqlToQuery(updateValues.settings);
		expect(query.sql).toMatch(
			/"organization"\."settings"\s*\|\|\s*jsonb_build_object\(\s*'onboarding'/
		);
		expect(query.sql).toMatch(
			/COALESCE\("organization"\."settings"->'onboarding',[\s\S]*\)\s*\|\|\s*\$2::jsonb/
		);
		expect(query.params).toContain(
			JSON.stringify({ initialSetup: 'skipped', whatsappAccount: 'not_needed' })
		);
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
					input: { initialSetup: 'complete' }
				}
			})
		).rejects.toThrow('not authorized');
		expect(findFirst).not.toHaveBeenCalled();
		expect(update).not.toHaveBeenCalled();
	});
});
