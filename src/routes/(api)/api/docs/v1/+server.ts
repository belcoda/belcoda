import { ScalarApiReference } from '@scalar/sveltekit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/public';
import { building } from '$app/environment';

const host = env.PUBLIC_HOST?.replace(/\/$/, '');

if (!host && !building) {
	throw new Error('v1 docs: PUBLIC_HOST is not configured');
}

const render = ScalarApiReference({
	url: `${host}/api/docs/v1/json`
});

export const GET: RequestHandler = () => {
	return render();
};
