import { env } from '$env/dynamic/public';
const { PUBLIC_NGROK_DOMAIN } = env;
import { checkDisallowedNames } from '$lib/utils/name';

export function detectSubdomain(host: string, rootDomain: string): string | false {
	if (host === rootDomain) {
		return false;
	}
	if (host === `app.${rootDomain}`) {
		return false;
	}

	if (PUBLIC_NGROK_DOMAIN && PUBLIC_NGROK_DOMAIN !== '') {
		// to stop the ngrok domain check triggering for "", "undefined" or "null"
		if (host === PUBLIC_NGROK_DOMAIN) {
			return false;
		}
	}

	const parts = host.split('.');
	// if it's a single-part domain (eg: example.com), then domain.split('.').length === 2 means it's root
	if (parts.length < 3) {
		// note that this will false-negative for domains like .com.au or .co.uk or .co.jp, but they should all be covered by the root check domain above
		if (!parts[parts.length - 1].includes('localhost')) {
			//subdomain.localhost:5173 is a valid subdomain but has less than 3 parts when split by '.' anything else is not a valid subdomain
			return false;
		}
	}
	try {
		checkDisallowedNames(parts[0]);
		// if there is no error, then the name is not disallowed
		const subdomain = parts[0];
		return subdomain;
	} catch (e) {
		return false;
	}
}
