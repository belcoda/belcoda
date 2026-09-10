import { authClient } from '$lib/auth-client';
import type { UserRole } from '$lib/schema/user';
import type { ReadOrganizationZero } from '$lib/schema/organization';
import { z } from '$lib/zero.svelte';
import { mutators } from '$lib/zero/mutate/client_mutators';
import { snapshotOrganizationSettings } from '$lib/utils/organization-onboarding';

export type InvitationOrganization = Pick<ReadOrganizationZero, 'id' | 'settings'>;

export function parseInvitationEmails(value: string) {
	return [
		...new Set(
			value
				.split(/[\s,;]+/)
				.map((email) => email.trim().toLowerCase())
				.filter(Boolean)
		)
	];
}

export async function recordInvitationProgress(organization: InvitationOrganization) {
	const result = await z.mutate(
		mutators.organization.updateOnboarding({
			metadata: {
				organizationId: organization.id,
				existingSettings: snapshotOrganizationSettings(organization.settings)
			},
			input: { invitations: 'complete' }
		})
	).server;
	if (result.type === 'error') throw new Error(result.error.message);
}

export async function sendInvitations(
	organization: InvitationOrganization,
	emails: string[],
	role: UserRole
) {
	const results = await Promise.allSettled(
		emails.map(async (email) => {
			const result = await authClient.organization.inviteMember({
				email,
				role,
				organizationId: organization.id
			});
			if (result.error) throw new Error(result.error.message);
		})
	);
	const sent = emails.filter((_, i) => results[i].status === 'fulfilled');
	const failed = emails.filter((_, i) => results[i].status === 'rejected');
	let progressSaved = true;
	if (sent.length) {
		try {
			await recordInvitationProgress(organization);
		} catch {
			progressSaved = false;
		}
	}
	return { sent, failed, progressSaved };
}
