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

	it('waits for the profile save before recording completion', async () => {
		let confirmSave!: (value: { type: 'success' }) => void;
		vi.mocked(z.mutate)
			.mockReturnValueOnce({
				server: new Promise((resolve) => {
					confirmSave = resolve;
				})
			} as never)
			.mockReturnValueOnce({ server: Promise.resolve({ type: 'success' }) } as never);

		const saving = saveOrganizationProfile(organization, input);
		expect(z.mutate).toHaveBeenCalledTimes(1);
		confirmSave({ type: 'success' });
		await saving;
		expect(z.mutate).toHaveBeenCalledTimes(2);
		expect(vi.mocked(z.mutate).mock.calls[1][0].args.input).toEqual({
			initialSetup: 'complete',
			profile: 'complete'
		});
	});

	it('does not record completion when saving the profile fails', async () => {
		vi.mocked(z.mutate).mockReturnValueOnce({
			server: Promise.resolve({ type: 'error', error: { message: 'Save failed' } })
		} as never);

		await expect(saveOrganizationProfile(organization, input)).rejects.toThrow('Save failed');
		expect(z.mutate).toHaveBeenCalledTimes(1);
	});

	it('reports a failed completion update so the user can retry', async () => {
		vi.mocked(z.mutate)
			.mockReturnValueOnce({ server: Promise.resolve({ type: 'success' }) } as never)
			.mockReturnValueOnce({
				server: Promise.resolve({ type: 'error', error: { message: 'Confirmation failed' } })
			} as never);

		await expect(saveOrganizationProfile(organization, input)).rejects.toThrow(
			'Confirmation failed'
		);
	});
});
