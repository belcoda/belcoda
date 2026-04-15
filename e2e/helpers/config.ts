export const BASE_URL =
	process.env.E2E_BASE_URL ?? process.env.PUBLIC_HOST ?? 'http://localhost:5173';

export function getPublicEventUrl(orgSlug: string, eventSlug: string): string {
	const url = new URL(BASE_URL);
	url.hostname = `${orgSlug}.${url.hostname}`;
	return `${url.origin}/events/${eventSlug}`;
}
