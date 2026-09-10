import { describe, expect, it } from 'vitest';
import { shouldRedirectToOrganizationSetup } from './organization-onboarding';

describe('organization onboarding routing', () => {
	it('sends organization managers with unfinished initial setup to setup', () => {
		expect(
			shouldRedirectToOrganizationSetup({
				pathname: '/dashboard',
				canManageOrganization: true,
				needsOnboarding: true
			})
		).toBe(true);
	});

	it.each(['/setup', '/settings/whatsapp/accounts'])(
		'allows onboarding routes while initial setup is unfinished',
		(pathname) => {
			expect(
				shouldRedirectToOrganizationSetup({
					pathname,
					canManageOrganization: true,
					needsOnboarding: true
				})
			).toBe(false);
		}
	);

	it('does not gate members or organizations that finished initial setup', () => {
		expect(
			shouldRedirectToOrganizationSetup({
				pathname: '/dashboard',
				canManageOrganization: false,
				needsOnboarding: true
			})
		).toBe(false);
		expect(
			shouldRedirectToOrganizationSetup({
				pathname: '/dashboard',
				canManageOrganization: true,
				needsOnboarding: false
			})
		).toBe(false);
	});
});
