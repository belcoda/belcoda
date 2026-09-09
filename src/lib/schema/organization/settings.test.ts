import { describe, expect, it } from 'vitest';
import * as v from 'valibot';
import {
	defaultOrganizationSettings,
	organizationNeedsOnboarding,
	organizationSettingsSchema,
	updateOrganizationOnboardingZeroMutatorSchema
} from '$lib/schema/organization/settings';

describe('organization onboarding settings', () => {
	it('marks newly created organization settings as needing onboarding', () => {
		const settings = v.parse(organizationSettingsSchema, defaultOrganizationSettings());

		expect(settings.onboarding).toEqual({
			initialSetup: 'pending',
			profile: 'pending',
			team: 'pending',
			people: 'pending',
			invitations: 'pending',
			whatsappAccount: 'pending',
			event: 'pending',
			publishEvent: 'pending',
			other: 'pending',
			advanced: 'pending'
		});
		expect(organizationNeedsOnboarding(settings.onboarding)).toBe(true);
	});

	it('keeps legacy organization settings valid and already onboarded', () => {
		const legacySettings = defaultOrganizationSettings();
		delete legacySettings.onboarding;
		const settings = v.parse(organizationSettingsSchema, legacySettings);

		expect(settings.onboarding).toBeUndefined();
		expect(organizationNeedsOnboarding(settings.onboarding)).toBe(false);
	});

	it('preserves old task progress without requiring the new introduction', () => {
		const onboarding = {
			whatsappAccount: 'skipped',
			event: 'complete',
			publishEvent: 'pending',
			other: 'pending',
			advanced: 'skipped'
		};
		const settings = v.parse(organizationSettingsSchema, {
			...defaultOrganizationSettings(),
			onboarding
		});

		expect(settings.onboarding).toEqual(onboarding);
		expect(organizationNeedsOnboarding(settings.onboarding)).toBe(false);
	});

	it.each(['skipped', 'complete'] as const)(
		'does not reopen %s initial setup for unfinished optional tasks',
		(initialSetup) => {
			const settings = defaultOrganizationSettings();
			if (!settings.onboarding) throw new Error('Expected onboarding settings');
			settings.onboarding.initialSetup = initialSetup;

			expect(organizationNeedsOnboarding(settings.onboarding)).toBe(false);
		}
	);

	it('accepts task dismissal separately from skipping or completing initial setup', () => {
		const patch = {
			metadata: {
				organizationId: '11111111-1111-4111-8111-111111111111',
				existingSettings: defaultOrganizationSettings()
			},
			input: { whatsappAccount: 'not_needed', team: 'skipped' }
		};

		expect(v.parse(updateOrganizationOnboardingZeroMutatorSchema, patch).input).toEqual(
			patch.input
		);
		expect(
			v.safeParse(updateOrganizationOnboardingZeroMutatorSchema, {
				...patch,
				input: { initialSetup: 'not_needed' }
			}).success
		).toBe(false);
	});
});
