import { buildBetterAuth } from '$lib/server/auth';
import pino from '$lib/pino';
const log = pino(import.meta.url);
export async function getSession({ locale, url }: { locale: string; url: URL }) {
	try {
		const token = url.searchParams.get('authToken');
		if (!token) {
			return null;
		}
		const auth = buildBetterAuth(locale);
		const session = await auth.api.verifyOneTimeToken({
			body: {
				token: token
			}
		});
		return session;
	} catch (error) {
		log.error(error, 'Error verifying one time token');
		throw error;
	}
}
