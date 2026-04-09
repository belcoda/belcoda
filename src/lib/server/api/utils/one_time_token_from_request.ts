import { error } from '@sveltejs/kit';

import { buildBetterAuth } from '$lib/server/auth';

/**
 * Create a one-time preview token for the current session.
 *
 * @param request - The incoming request whose headers (including session cookies) are forwarded to the auth API
 * @param locale - Locale identifier used to construct the auth instance
 * @returns The generated one-time token string for preview authentication
 * @throws An HTTP 500 error when a token cannot be prepared; preserves and rethrows errors that already include an HTTP `status`
 */
export async function generateOneTimeTokenFromRequest(
	request: Request,
	locale: string
): Promise<string> {
	const auth = buildBetterAuth(locale);

	try {
		const data = await auth.api.generateOneTimeToken({
			headers: request.headers
		});
		const token =
			data &&
			typeof data === 'object' &&
			'token' in data &&
			typeof (data as { token: unknown }).token === 'string'
				? (data as { token: string }).token
				: null;
		if (!token) {
			throw error(500, 'Could not prepare preview link');
		}
		return token;
	} catch (e) {
		if (e && typeof e === 'object' && 'status' in e) {
			throw e;
		}
		console.error('generateOneTimeToken failed', e);
		throw error(500, 'Could not prepare preview link');
	}
}
