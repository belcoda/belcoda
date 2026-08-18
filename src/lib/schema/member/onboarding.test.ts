import { describe, expect, it } from 'vitest';
import { inferMemberOnboardingPatch } from '$lib/schema/member/onboarding';
import { defaultMemberOnboardingSettings } from '$lib/schema/member/settings';

describe('member onboarding inference', () => {
	it('completes pending steps whose facts can be inferred', () => {
		expect(
			inferMemberOnboardingPatch({
				settings: defaultMemberOnboardingSettings('pending'),
				facts: {
					language: true,
					whatsappAccount: true,
					event: true,
					publishEvent: true
				}
			})
		).toEqual({
			language: 'complete',
			whatsappAccount: 'complete',
			event: 'complete',
			publishEvent: 'complete'
		});
	});

	it('does not complete a step when its fact is absent', () => {
		expect(
			inferMemberOnboardingPatch({
				settings: defaultMemberOnboardingSettings('pending'),
				facts: {
					language: true,
					whatsappAccount: false,
					event: false,
					publishEvent: false
				}
			})
		).toEqual({ language: 'complete' });
	});

	it('never overwrites completed or skipped steps', () => {
		const settings = {
			...defaultMemberOnboardingSettings('pending'),
			language: 'complete' as const,
			whatsappAccount: 'skipped' as const
		};

		expect(
			inferMemberOnboardingPatch({
				settings,
				facts: {
					language: true,
					whatsappAccount: true,
					event: false,
					publishEvent: false
				}
			})
		).toEqual({});
	});

	it('leaves explicit-only steps out of inferred patches', () => {
		const patch = inferMemberOnboardingPatch({
			settings: defaultMemberOnboardingSettings('pending'),
			facts: {
				language: true,
				whatsappAccount: true,
				event: true,
				publishEvent: true
			}
		});

		expect(patch).not.toHaveProperty('other');
		expect(patch).not.toHaveProperty('advanced');
	});
});
