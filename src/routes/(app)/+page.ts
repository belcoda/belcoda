import { redirect } from '@sveltejs/kit';

/**
 * Immediately redirects the request to `/community` using HTTP status 302.
 *
 * @throws A SvelteKit redirect that results in an HTTP 302 redirect to `/community`.
 */
export async function load() {
	throw redirect(302, '/community');
}
