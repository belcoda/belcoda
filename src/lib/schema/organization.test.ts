import { describe, expect, it } from 'vitest';
import * as v from 'valibot';
import {
	buildOrganizationOnboardingMetadata,
	newOrganizationFromWebsiteForm,
	organizationMetadataSchema,
	type NewOrganizationFromWebsiteForm
} from '$lib/schema/organization';

const baseForm: NewOrganizationFromWebsiteForm = {
	name: 'Community Builders',
	slug: 'community-builders',
	icon: null,
	additionalDetails: {
		howDidYouDiscover: 'friend-or-colleague',
		howDidYouDiscoverDetail: ''
	}
};

describe('newOrganizationFromWebsiteForm', () => {
	it('accepts the current discovery source options', () => {
		const parsed = v.parse(newOrganizationFromWebsiteForm, {
			...baseForm,
			additionalDetails: {
				...baseForm.additionalDetails,
				howDidYouDiscover: 'event-or-webinar'
			}
		});

		expect(parsed.additionalDetails.howDidYouDiscover).toBe('event-or-webinar');
	});

	it('caps the discovery source detail at 500 characters', () => {
		expect(() =>
			v.parse(newOrganizationFromWebsiteForm, {
				...baseForm,
				additionalDetails: {
					...baseForm.additionalDetails,
					howDidYouDiscover: 'other',
					howDidYouDiscoverDetail: 'a'.repeat(501)
				}
			})
		).toThrow();
	});
});

describe('buildOrganizationOnboardingMetadata', () => {
	it('preserves Other source detail in organization metadata', () => {
		const metadata = buildOrganizationOnboardingMetadata({
			...baseForm,
			additionalDetails: {
				...baseForm.additionalDetails,
				howDidYouDiscover: 'other',
				howDidYouDiscoverDetail: 'A local nonprofit list'
			}
		});

		expect(v.parse(organizationMetadataSchema, metadata)).toEqual({
			onboarding: {
				discoverySource: 'other',
				discoverySourceDetail: 'A local nonprofit list'
			}
		});
	});

	it('keeps non-Other source detail empty for cleaner analysis', () => {
		const metadata = buildOrganizationOnboardingMetadata({
			...baseForm,
			additionalDetails: {
				...baseForm.additionalDetails,
				howDidYouDiscover: 'search-engine',
				howDidYouDiscoverDetail: 'manual payload detail'
			}
		});

		expect(metadata).toEqual({
			onboarding: {
				discoverySource: 'search-engine',
				discoverySourceDetail: null
			}
		});
	});
});
