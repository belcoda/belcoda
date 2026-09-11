import type { OrganizationSettingsSchema } from '$lib/schema/organization/settings';

export function organizationNeedsOnboardingStorageKey(organizationId: string): string {
	return `state:organizationNeedsOnboarding:${organizationId}`;
}

export function snapshotOrganizationSettings(
	settings: OrganizationSettingsSchema
): OrganizationSettingsSchema {
	return JSON.parse(JSON.stringify(settings));
}

export function shouldRedirectToOrganizationSetup({
	pathname,
	canManageOrganization,
	needsOnboarding
}: {
	pathname: string;
	canManageOrganization: boolean;
	needsOnboarding: boolean;
}): boolean {
	const isSetupRoute = pathname === '/setup' || pathname.startsWith('/setup/');
	const isWhatsAppSetupRoute =
		pathname === '/settings/whatsapp/accounts' ||
		pathname.startsWith('/settings/whatsapp/accounts/');

	return canManageOrganization && needsOnboarding && !isSetupRoute && !isWhatsAppSetupRoute;
}
