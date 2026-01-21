export function isSubdomain(subdomain: string, domain: string) {
	return subdomain.endsWith(`.${domain}`);
}
