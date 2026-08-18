import { describe, expect, it } from 'vitest';
import {
	defaultMemberOnboardingSettings,
	defaultMemberSettings,
	memberOnboardingIsComplete,
	parseMemberSettings
} from '$lib/schema/member/settings';

describe('member onboarding settings', () => {
	it('can initialize every onboarding step as pending', () => {
		expect(defaultMemberSettings({ onboardingStatus: 'pending' }).onboarding).toEqual({
			language: 'pending',
			whatsappAccount: 'pending',
			event: 'pending',
			publishEvent: 'pending',
			other: 'pending',
			advanced: 'pending'
		});
	});

	it('defaults existing members to completed onboarding', () => {
		expect(defaultMemberSettings().onboarding).toEqual(defaultMemberOnboardingSettings('complete'));
	});

	it('accepts legacy member settings without onboarding state', () => {
		expect(
			parseMemberSettings({ notifications: defaultMemberSettings().notifications })?.onboarding
		).toBeUndefined();
	});

	it('considers skipped and complete steps resolved', () => {
		const settings = {
			...defaultMemberOnboardingSettings('complete'),
			advanced: 'skipped' as const
		};

		expect(memberOnboardingIsComplete(settings)).toBe(true);
		expect(memberOnboardingIsComplete({ ...settings, language: 'pending' })).toBe(false);
	});
});
