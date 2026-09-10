import { trackAnalyticsEvent } from '$lib/utils/analytics';

export const teamAnalyticsEventNames = {
	created: 'team_created'
} as const;

export function trackTeamCreated(): void {
	trackAnalyticsEvent(teamAnalyticsEventNames.created);
}
