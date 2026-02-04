export function isSubdomain(subdomain: string, domain: string) {
	return subdomain.endsWith(`.${domain}`);
}

import { env as publicEnv } from '$env/dynamic/public';
const { PUBLIC_POSTMARK_SENDING_DOMAIN } = publicEnv;
const postmarkSendingDomain = PUBLIC_POSTMARK_SENDING_DOMAIN || 'belcoda.com';
import type { ReadOrganizationZero } from '$lib/schema/organization';
export function getSystemEmailAddress(organization: ReadOrganizationZero | undefined) {
	if (!organization) return '';
	return `${organization.slug}@${postmarkSendingDomain}`;
}
