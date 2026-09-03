import { describe, expect, it } from 'vitest';
import * as v from 'valibot';
import {
	defaultOrganizationSettings,
	organizationNeedsOnboarding,
	organizationSettingsSchema
} from '$lib/schema/organization/settings';

describe('organization onboarding settings', () => {
	it('marks newly created organization settings as needing onboarding', () => {
		const settings = v.parse(organizationSettingsSchema, defaultOrganizationSettings());

		expect(settings.onboarding).toEqual({
			whatsappAccount: 'pending',
			event: 'pending',
			publishEvent: 'pending',
			other: 'pending',
			advanced: 'pending'
		});
		expect(organizationNeedsOnboarding(settings.onboarding)).toBe(true);
	});

	it('keeps legacy organization settings valid and already onboarded', () => {
		const { onboarding: _onboarding, ...legacySettings } = defaultOrganizationSettings();
		const settings = v.parse(organizationSettingsSchema, legacySettings);

		expect(settings.onboarding).toBeUndefined();
		expect(organizationNeedsOnboarding(settings.onboarding)).toBe(false);
	});
});
