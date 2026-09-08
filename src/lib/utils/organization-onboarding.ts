export function organizationNeedsOnboardingStorageKey(organizationId: string): string {
	return `state:organizationNeedsOnboarding:${organizationId}`;
}
