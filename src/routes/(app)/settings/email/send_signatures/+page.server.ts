import { env } from '$env/dynamic/private';
const { POSTMARK_SENDING_DOMAIN } = env;

export async function load() {
	return {
		postmarkSendingDomain: POSTMARK_SENDING_DOMAIN || 'belcoda.com'
	};
}
