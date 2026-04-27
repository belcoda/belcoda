// routes/+server.ts
import { ScalarApiReference } from '@scalar/sveltekit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/public';
const host = env.PUBLIC_HOST?.replace(/\/$/, '');
import { building } from '$app/environment';
if (!host && !building) {
	throw new Error('webhooks docs: PUBLIC_HOST is not configured');
}
const render = ScalarApiReference({
	url: `${host}/api/docs/webhooks/json`
});
export const GET: RequestHandler = () => {
	return render();
};
