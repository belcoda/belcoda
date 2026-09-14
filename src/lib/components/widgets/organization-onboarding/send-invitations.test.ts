import { beforeEach, describe, expect, it, vi } from 'vitest';
import { authClient } from '$lib/auth-client';
import { z } from '$lib/zero.svelte';
import { defaultOrganizationSettings } from '$lib/schema/organization/settings';
import {
	parseInvitationEmails,
	recordInvitationProgress,
	sendInvitations
} from './send-invitations';

vi.mock('$lib/auth-client', () => ({ authClient: { organization: { inviteMember: vi.fn() } } }));
vi.mock('$lib/zero.svelte', () => ({ z: { mutate: vi.fn() } }));

const organization = {
	id: '11111111-1111-4111-8111-111111111111',
	settings: defaultOrganizationSettings()
};

describe('onboarding invitations', () => {
	beforeEach(() => {
		vi.resetAllMocks();
		vi.mocked(z.mutate).mockReturnValue({ server: Promise.resolve({ type: 'success' }) } as never);
	});

	it('accepts pasted address lists and removes duplicates', () => {
		expect(
			parseInvitationEmails(' Alice@example.org; bob@example.org\nalice@EXAMPLE.org, ')
		).toEqual(['alice@example.org', 'bob@example.org']);
	});

	it('marks partial success complete and retries only failed addresses', async () => {
		vi.mocked(authClient.organization.inviteMember)
			.mockResolvedValueOnce({ error: null } as never)
			.mockResolvedValueOnce({ error: { message: 'Failed' } } as never)
			.mockResolvedValueOnce({ error: null } as never);
		const result = await sendInvitations(
			organization,
			['alice@example.org', 'bob@example.org'],
			'member'
		);
		expect(result).toEqual({
			sent: ['alice@example.org'],
			failed: ['bob@example.org'],
			progressSaved: true
		});
		expect(z.mutate).toHaveBeenCalledTimes(1);
		await sendInvitations(organization, result.failed, 'member');
		expect(
			vi.mocked(authClient.organization.inviteMember).mock.calls.map(([input]) => input.email)
		).toEqual(['alice@example.org', 'bob@example.org', 'bob@example.org']);
	});

	it('does not record completion when every invitation fails', async () => {
		vi.mocked(authClient.organization.inviteMember).mockRejectedValue(new Error('Offline'));
		const result = await sendInvitations(organization, ['alice@example.org'], 'member');
		expect(result.sent).toEqual([]);
		expect(result.failed).toEqual(['alice@example.org']);
		expect(z.mutate).not.toHaveBeenCalled();
	});

	it('retries a failed progress save without sending invitations again', async () => {
		vi.mocked(authClient.organization.inviteMember).mockResolvedValue({ error: null } as never);
		vi.mocked(z.mutate).mockReturnValueOnce({
			server: Promise.resolve({ type: 'error', error: { message: 'Offline' } })
		} as never);
		const result = await sendInvitations(organization, ['alice@example.org'], 'member');
		expect(result).toEqual({ sent: ['alice@example.org'], failed: [], progressSaved: false });
		await recordInvitationProgress(organization);
		expect(authClient.organization.inviteMember).toHaveBeenCalledTimes(1);
		expect(z.mutate).toHaveBeenCalledTimes(2);
	});
});
