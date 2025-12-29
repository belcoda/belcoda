import { createAuthClient } from 'better-auth/client';
import { organizationClient, apiKeyClient, oneTimeTokenClient } from 'better-auth/client/plugins';
import { stripeClient } from '@better-auth/stripe/client';

export const authClient = createAuthClient({
	plugins: [
		organizationClient(),
		apiKeyClient(),
		stripeClient({
			subscription: true //if you want to enable subscription management
		}),
		oneTimeTokenClient()
	]
});

import { appState } from '$lib/state.svelte';
export async function setActiveOrganizationId(organizationId: string) {
	await authClient.organization.setActive({
		organizationId
	});
	appState.setOrganizationId(organizationId);
}
