import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defaultOrganizationSettings } from '$lib/schema/organization/settings';
import { createTeam } from './team';
import { updateOrganizationOnboarding } from '$lib/server/api/data/organization';
import { createOnboardingTeam } from './onboarding';

vi.mock('./team', () => ({ createTeam: vi.fn() }));
vi.mock('$lib/server/api/data/organization', () => ({ updateOrganizationOnboarding: vi.fn() }));

const tx = {} as Parameters<typeof createOnboardingTeam>[0]['tx'];
const organizationId = '11111111-1111-4111-8111-111111111111';
const ctx = {
	userId: '22222222-2222-4222-8222-222222222222',
	adminOrgs: [organizationId],
	ownerOrgs: [],
	otherOrgs: [],
	authTeams: []
};
const args = {
	metadata: {
		organizationId,
		teamId: '33333333-3333-4333-8333-333333333333',
		existingSettings: defaultOrganizationSettings()
	},
	input: { name: 'Field organisers', parentTeamId: null }
};

describe('onboarding team creation', () => {
	beforeEach(() => vi.resetAllMocks());

	it('creates the team and records completion in the same transaction', async () => {
		await createOnboardingTeam({ tx, ctx, args });
		expect(createTeam).toHaveBeenCalledWith({ tx, ctx, args });
		expect(updateOrganizationOnboarding).toHaveBeenCalledWith({
			tx,
			ctx,
			args: { metadata: args.metadata, input: { team: 'complete' } }
		});
	});

	it('does not record completion when team creation is rejected', async () => {
		vi.mocked(createTeam).mockRejectedValueOnce(new Error('Team creation rejected'));
		await expect(createOnboardingTeam({ tx, ctx, args })).rejects.toThrow('Team creation rejected');
		expect(updateOrganizationOnboarding).not.toHaveBeenCalled();
	});

	it('fails the transaction when recording completion fails', async () => {
		vi.mocked(updateOrganizationOnboarding).mockRejectedValueOnce(
			new Error('Progress save failed')
		);
		await expect(createOnboardingTeam({ tx, ctx, args })).rejects.toThrow('Progress save failed');
	});
});
