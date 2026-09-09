import type { ReadOrganizationZero, UpdateOrganization } from '$lib/schema/organization';
import { z } from '$lib/zero.svelte';
import { mutators } from '$lib/zero/mutate/client_mutators';

export async function saveOrganizationProfile(
	organization: Pick<ReadOrganizationZero, 'id' | 'settings'>,
	input: UpdateOrganization
) {
	const saved = await z.mutate(
		mutators.organization.update({
			metadata: { organizationId: organization.id },
			input
		})
	).server;
	if (saved.type === 'error') throw new Error(saved.error.message);

	const confirmed = await z.mutate(
		mutators.organization.updateOnboarding({
			metadata: {
				organizationId: organization.id,
				existingSettings: organization.settings
			},
			input: { profile: 'complete' }
		})
	).server;
	if (confirmed.type === 'error') throw new Error(confirmed.error.message);
}
