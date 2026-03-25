import { createAuthClient } from 'better-auth/client';
import {
	organizationClient,
	inferOrgAdditionalFields,
	apiKeyClient,
	oneTimeTokenClient
} from 'better-auth/client/plugins';
import { stripeClient } from '@better-auth/stripe/client';
import type { BetterAuth } from '$lib/server/auth';
export const authClient = createAuthClient({
	plugins: [
		organizationClient({
			schema: inferOrgAdditionalFields<BetterAuth>()
		}),
		apiKeyClient(),
		stripeClient({
			subscription: true //if you want to enable subscription management
		}),
		oneTimeTokenClient()
	]
});
