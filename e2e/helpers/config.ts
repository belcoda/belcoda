export const BASE_URL =
	process.env.E2E_BASE_URL ?? process.env.PUBLIC_HOST ?? 'http://localhost:5173';
export const E2E_MOCK_WABA_ID = 'e2e-mock-waba-id';
export const E2E_DUMMY_WHATSAPP_NUMBER = '+15555555555';

export const E2E_ORG_SLUG = 'e2e-event-org';

export function slugifyTitle(title: string): string {
	return title
		.trim()
		.toLowerCase()
		.replace(/[^a-z0-9 -]/g, '')
		.replace(/\s+/g, '-')
		.replace(/-+/g, '-');
}

export function getPublicEventUrl(orgSlug: string, eventSlug: string): string {
	const url = new URL(BASE_URL);
	url.hostname = `${orgSlug}.${url.hostname}`;
	return `${url.origin}/events/${eventSlug}`;
}

export function getPublicPetitionUrl(orgSlug: string, petitionSlug: string): string {
	const url = new URL(BASE_URL);
	url.hostname = `${orgSlug}.${url.hostname}`;
	return `${url.origin}/petitions/${petitionSlug}`;
}
