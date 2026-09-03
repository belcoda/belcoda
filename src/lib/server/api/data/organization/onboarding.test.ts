import { beforeEach, describe, expect, it, vi } from 'vitest';

import { updateOrganizationOnboarding } from '$lib/server/api/data/organization';
import { defaultOrganizationSettings } from '$lib/schema/organization/settings';
import { getQueue } from '$lib/server/queue';

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
	let settings = organizationRecord.settings;
	const returning = vi.fn(async () => [
		{
			...organizationRecord,
			settings,
			updatedAt: new Date('2026-01-02T00:00:00.000Z')
		}
	]);
	const where = vi.fn(() => ({ returning }));
	const set = vi.fn((values: { settings: typeof settings }) => {
		settings = values.settings;
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

	it('authorizes against and merges with the persisted organization settings', async () => {
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

		expect(set).toHaveBeenCalledWith(
			expect.objectContaining({
				settings: expect.objectContaining({
					theme: expect.objectContaining({ primaryColor: '#123456' }),
					onboarding: expect.objectContaining({
						event: 'complete',
						whatsappAccount: 'pending'
					})
				})
			})
		);
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
