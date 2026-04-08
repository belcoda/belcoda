import { error } from '@sveltejs/kit';

import { buildBetterAuth } from '$lib/server/auth';

/**
 * Generates a one-time token for the current session via `auth.api.generateOneTimeToken` (see
 * better-auth one-time-token plugin). Pass the load `request.headers` so session cookies are
 * present — same as `auth.api.getSession({ headers })` in hooks.
 *
 * Preview runs under `(app)` with a normal session; the `authToken` query on public pages is only
 * for verifying after redirect, not for generating here.
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
