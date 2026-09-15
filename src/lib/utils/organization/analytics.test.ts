import { beforeEach, describe, expect, it, vi } from 'vitest';

const { trackAnalyticsEvent } = vi.hoisted(() => ({
	trackAnalyticsEvent: vi.fn()
}));

vi.mock('$lib/utils/analytics', () => ({ trackAnalyticsEvent }));

import {
	organizationAnalyticsEventNames,
	trackOnboardingInvitesSent,
	trackOrganizationCreated
} from './analytics';

describe('organization analytics', () => {
	beforeEach(() => {
		trackAnalyticsEvent.mockClear();
	});

	it('tracks a created organization without including free-text details', () => {
		trackOrganizationCreated({
			name: 'Community Group',
			slug: 'community-group',
			website: 'https://example.com',
			icon: 'https://example.com/logo.png',
			additionalDetails: {
				howDidYouDiscover: 'other',
				howDidYouDiscoverDetail: 'Private free-text answer'
			}
		});

		expect(trackAnalyticsEvent).toHaveBeenCalledExactlyOnceWith(
			organizationAnalyticsEventNames.created,
			{
				has_website: true,
				has_logo: true,
				discovery_source: 'other'
			}
		);
	});

	it('tracks confirmed invitation results without including addresses', () => {
		trackOnboardingInvitesSent(6, 2, 'admin');

		expect(trackAnalyticsEvent).toHaveBeenCalledExactlyOnceWith(
			organizationAnalyticsEventNames.onboardingInvitesSent,
			{
				count_band: 'six_plus',
				role: 'admin',
				partial_failure: true
			}
		);
	});

	it('does not track when no invitation was sent', () => {
		trackOnboardingInvitesSent(0, 3, 'member');

		expect(trackAnalyticsEvent).not.toHaveBeenCalled();
	});
});
