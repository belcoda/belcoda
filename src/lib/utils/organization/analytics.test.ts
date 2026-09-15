import { beforeEach, describe, expect, it, vi } from 'vitest';

const { trackAnalyticsEvent } = vi.hoisted(() => ({
	trackAnalyticsEvent: vi.fn()
}));

vi.mock('$lib/utils/analytics', () => ({ trackAnalyticsEvent }));

import { organizationAnalyticsEventNames, trackOrganizationCreated } from './analytics';

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
});
