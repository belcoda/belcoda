// routes/+server.ts
import { ScalarApiReference } from '@scalar/sveltekit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/public';
const { PUBLIC_HOST } = env;
const render = ScalarApiReference({
	url: `${PUBLIC_HOST}/api/docs/webhooks/json`
});
export const GET: RequestHandler = () => {
	return render();
};
