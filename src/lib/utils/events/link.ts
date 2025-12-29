import { dev } from '$app/environment';
import { env } from '$env/dynamic/public';
export function getEventLink({
	eventSlug,
	organizationSlug
}: {
	eventSlug: string;
	organizationSlug: string;
}) {
	return `http${dev ? '' : 's'}://${organizationSlug}.${env.PUBLIC_ROOT_DOMAIN}/events/${eventSlug}`;
}
