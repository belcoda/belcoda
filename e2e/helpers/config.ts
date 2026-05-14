export const BASE_URL =
	process.env.E2E_BASE_URL ?? process.env.PUBLIC_HOST ?? 'http://localhost:5173';
export const E2E_MOCK_WABA_ID = 'e2e-mock-waba-id';
export const E2E_DUMMY_WHATSAPP_NUMBER = '+15555555555';

export type E2EProject =
	| 'auth'
	| 'community'
	| 'events'
	| 'petitions'
	| 'communications'
	| 'settings'
	| 'whatsapp-accounts';

export const E2E_PROJECTS: E2EProject[] = [
	'auth',
	'community',
	'events',
	'petitions',
	'communications',
	'settings',
	'whatsapp-accounts'
];

export function getOrgSlug(project: E2EProject): string {
	if (project === 'whatsapp-accounts') {
		return 'fixture-messaging-org';
	}
	return `e2e-${project}-org`;
}

export function getOrgName(project: E2EProject): string {
	if (project === 'whatsapp-accounts') {
		return 'Fixture Messaging Org';
	}
	return `E2E ${project.charAt(0).toUpperCase() + project.slice(1)} Org`;
}

export function getUserEmails(project: E2EProject) {
	return {
		owner: `e2e-${project}-owner@belcoda.test`,
		admin: `e2e-${project}-admin@belcoda.test`,
		member: `e2e-${project}-member@belcoda.test`
	};
}

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
