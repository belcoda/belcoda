const E2E_ORGANIZATION_SLUG_PREFIXES = ['e2e-', 'fixture-'];

export function isE2EOrganizationSlug(slug: string): boolean {
	return E2E_ORGANIZATION_SLUG_PREFIXES.some((prefix) => slug.startsWith(prefix));
}
