import type { FullConfig } from '@playwright/test';
import { chromium } from '@playwright/test';
import { TEST_USERS, signUpUser, verifyUserEmail } from '../helpers/auth';
import { BASE_URL } from '../helpers/config';
import path from 'path';

export const STORAGE_STATE_PATH = path.join(import.meta.dirname, '../.auth/cookie-consent.json');

async function cleanup() {
	console.log('  Cleaning up existing test data...');
	const response = await fetch(`${BASE_URL}/api/e2e/cleanup`, { method: 'POST' });
	if (!response.ok) {
		const err = await response.text();
		throw new Error(`Cleanup failed: ${response.status} ${err}`);
	}
	console.log('  ✓ Test data cleaned up');
}

async function createOrganization(
	ownerEmail: string,
	orgName: string,
	members: Array<{ email: string; role: string }>
) {
	console.log(`  Creating organization "${orgName}"...`);
	const response = await fetch(`${BASE_URL}/api/e2e/create-organization`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json', origin: BASE_URL },
		body: JSON.stringify({ name: orgName, ownerEmail, members })
	});

	if (!response.ok) {
		const err = await response.text();
		throw new Error(`Failed to create organization: ${response.status} ${err}`);
	}

	return response.json();
}

async function saveCookieConsentState() {
	const browser = await chromium.launch();
	const context = await browser.newContext();
	const url = new URL(BASE_URL);
	const hostname = url.hostname;
	await context.addCookies([
		{
			name: 'belcoda_cookie_consent',
			value: 'accepted',
			domain: hostname,
			path: '/',
			sameSite: 'Lax'
		},
		{
			name: 'belcoda_cookie_consent',
			value: 'accepted',
			domain: `.${hostname}`,
			path: '/',
			sameSite: 'Lax'
		}
	]);
	await context.storageState({ path: STORAGE_STATE_PATH });
	await browser.close();
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default async function globalSetup(_config: FullConfig) {
	console.log('\n🔧 E2E Setup: Preparing test data...\n');

	await cleanup();

	console.log('Creating test users...');
	for (const [role, user] of Object.entries(TEST_USERS)) {
		await signUpUser(user);
		await verifyUserEmail(user.email);
		console.log(`  ✓ ${user.email} (${role})`);
	}

	console.log('\nCreating organization...');
	const org = await createOrganization(TEST_USERS.owner.email, 'E2E Event Org', [
		{ email: TEST_USERS.admin.email, role: 'admin' },
		{ email: TEST_USERS.member.email, role: 'member' }
	]);
	console.log(`  ✓ Organization created: ${org.id}`);

	await saveCookieConsentState();

	console.log('\n✅ Setup complete!\n');
}
