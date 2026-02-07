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
