import { trackAnalyticsEvent } from '$lib/utils/analytics';
import type { MutatorResultDetails } from '@rocicorp/zero';

export const teamAnalyticsEventNames = {
	created: 'team_created',
	memberAdded: 'team_member_added'
} as const;

export type TeamMemberType = 'person' | 'user';

export function trackTeamCreated(): void {
	trackAnalyticsEvent(teamAnalyticsEventNames.created);
}

export function trackTeamMemberAdded(memberType: TeamMemberType): void {
	trackAnalyticsEvent(teamAnalyticsEventNames.memberAdded, { member_type: memberType });
}

async function trackWhenConfirmed(
	confirmation: Promise<MutatorResultDetails>,
	track: () => void
): Promise<void> {
	try {
		const result = await confirmation;
		if (result.type === 'success') track();
	} catch {
		// Analytics is best effort and must not affect the completed action.
	}
}

export async function trackTeamCreatedWhenConfirmed(
	confirmation: Promise<MutatorResultDetails>
): Promise<void> {
	await trackWhenConfirmed(confirmation, trackTeamCreated);
}

export async function trackTeamMemberAddedWhenConfirmed(
	confirmation: Promise<MutatorResultDetails>,
	memberType: TeamMemberType
): Promise<void> {
	await trackWhenConfirmed(confirmation, () => trackTeamMemberAdded(memberType));
}
