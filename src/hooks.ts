import { detectSubdomain } from '$lib/utils/routing';

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
			url.pathname = `/page/${subdomain}${url.pathname}`; //pathname starts with a /
			return url.pathname;
		}
	}
};
