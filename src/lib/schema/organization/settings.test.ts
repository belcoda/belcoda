import { describe, expect, it } from 'vitest';
import * as v from 'valibot';
import {
	defaultOrganizationOnboardingSettings,
	defaultOrganizationSettings,
	organizationOnboardingIsComplete,
	organizationSettingsSchema
} from '$lib/schema/organization/settings';

describe('organization onboarding settings', () => {
	it('can initialize every onboarding step as pending for a new organization', () => {
		expect(defaultOrganizationSettings({ onboardingStatus: 'pending' }).onboarding).toEqual({
			whatsappAccount: 'pending',
			event: 'pending',
			publishEvent: 'pending',
			other: 'pending',
			advanced: 'pending'
		});
	});

	it('accepts legacy organization settings without onboarding flags', () => {
		const { onboarding: _onboarding, ...legacySettings } = defaultOrganizationSettings();

		expect(v.parse(organizationSettingsSchema, legacySettings).onboarding).toBeUndefined();
	});

	it('considers skipped and complete steps resolved', () => {
		const settings = {
			...defaultOrganizationOnboardingSettings('complete'),
			advanced: 'skipped' as const
		};

		expect(organizationOnboardingIsComplete(settings)).toBe(true);
		expect(organizationOnboardingIsComplete({ ...settings, event: 'pending' })).toBe(false);
	});
});
