import { trackAnalyticsEvent } from '$lib/utils/analytics';
import type { MutatorResultDetails } from '@rocicorp/zero';

export const teamAnalyticsEventNames = {
	created: 'team_created'
} as const;

export function trackTeamCreated(): void {
	trackAnalyticsEvent(teamAnalyticsEventNames.created);
}

export async function trackTeamCreatedWhenConfirmed(
	confirmation: Promise<MutatorResultDetails>
): Promise<void> {
	try {
		const result = await confirmation;
		if (result.type === 'success') trackTeamCreated();
	} catch {
		// Analytics is best effort and must not affect team creation.
	}
}
