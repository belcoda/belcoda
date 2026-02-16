import { dev } from '$app/environment';
import { env } from '$env/dynamic/public';

export function getPetitionLink({
	petitionSlug,
	organizationSlug
}: {
	petitionSlug: string;
	organizationSlug: string;
}) {
	return `http${dev ? '' : 's'}://${organizationSlug}.${env.PUBLIC_ROOT_DOMAIN}/petitions/${petitionSlug}`;
}
