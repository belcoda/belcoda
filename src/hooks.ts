import { detectSubdomain } from '$lib/utils/routing';
import pino from '$lib/pino';
const log = pino(import.meta.url);
import { env } from '$env/dynamic/public';
const { PUBLIC_ROOT_DOMAIN } = env;

export const reroute = async ({ url }) => {
	const subdomainOrFalse = detectSubdomain(url.host, PUBLIC_ROOT_DOMAIN as string);
	if (subdomainOrFalse === false) {
		return url.pathname;
	} else {
		const subdomain = subdomainOrFalse;
		if (url.pathname.startsWith(`/page/${subdomain}/`)) {
			// If the pathname already starts with /page/${subdomain}/, we don't need to do anything
			return url.pathname;
		} else {
			log.debug(
				{
					url: url.toString(),
					time: new Date().getTime(),
					newRoute: `/page/${subdomain}${url.pathname}`
				},
				'[DEBUG] Rerouting to page on subdomain'
			);
			return `/page/${subdomain}${url.pathname}`; //pathname starts with a /
		}
	}
};
