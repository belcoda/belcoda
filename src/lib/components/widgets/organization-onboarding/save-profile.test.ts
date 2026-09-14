import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defaultOrganizationSettings } from '$lib/schema/organization/settings';
import { z } from '$lib/zero.svelte';
import { saveOrganizationProfile } from './save-profile';

vi.mock('$lib/zero.svelte', () => ({ z: { mutate: vi.fn() } }));

const organization = {
	id: '11111111-1111-4111-8111-111111111111',
	settings: defaultOrganizationSettings()
};
const input = {
	country: 'KE' as const,
	defaultLanguage: 'en' as const,
	defaultTimezone: 'Africa/Nairobi'
};

describe('saving the onboarding profile', () => {
	beforeEach(() => vi.mocked(z.mutate).mockReset());

	it('saves the profile and onboarding completion in one mutation', async () => {
		vi.mocked(z.mutate).mockReturnValueOnce({
			server: Promise.resolve({ type: 'success' })
		} as never);

		await saveOrganizationProfile(organization, input);

		expect(z.mutate).toHaveBeenCalledTimes(1);
		expect(vi.mocked(z.mutate).mock.calls[0][0].mutator.mutatorName).toBe(
			'organization.updateProfileOnboarding'
		);
	});

	it('reports a failed profile and completion update', async () => {
		vi.mocked(z.mutate).mockReturnValueOnce({
			server: Promise.resolve({ type: 'error', error: { message: 'Save failed' } })
		} as never);

		await expect(saveOrganizationProfile(organization, input)).rejects.toThrow('Save failed');
		expect(z.mutate).toHaveBeenCalledTimes(1);
	});
});
