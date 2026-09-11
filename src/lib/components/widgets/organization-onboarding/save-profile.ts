import type { ReadOrganizationZero, UpdateOrganization } from '$lib/schema/organization';
import { z } from '$lib/zero.svelte';
import { mutators } from '$lib/zero/mutate/client_mutators';
import { snapshotOrganizationSettings } from '$lib/utils/organization-onboarding';

export async function saveOrganizationProfile(
	organization: Pick<ReadOrganizationZero, 'id' | 'settings'>,
	input: UpdateOrganization
) {
	const saved = await z.mutate(
		mutators.organization.updateProfileOnboarding({
			metadata: {
				organizationId: organization.id,
				existingSettings: snapshotOrganizationSettings(organization.settings)
			},
			input
		})
	).server;
	if (saved.type === 'error') throw new Error(saved.error.message);
}
