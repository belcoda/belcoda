import type { FullConfig } from '@playwright/test';
import { chromium } from '@playwright/test';
import { getTestUsers, signUpUser, verifyUserEmail } from '../helpers/auth';
import { BASE_URL, E2E_MOCK_WABA_ID, E2E_PROJECTS, getOrgName } from '../helpers/config';
import path from 'path';
import fs from 'fs';

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
	members: Array<{ email: string; role: string }>,
	wabaId: string | null
) {
	console.log(`  Creating organization "${orgName}"...`);
	const response = await fetch(`${BASE_URL}/api/e2e/create-organization`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json', origin: BASE_URL },
		body: JSON.stringify({ name: orgName, ownerEmail, members, wabaId })
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
	// Ensure the .auth directory exists before writing storage state
	const authDir = path.dirname(STORAGE_STATE_PATH);
	if (!fs.existsSync(authDir)) {
		fs.mkdirSync(authDir, { recursive: true });
	}
	await context.storageState({ path: STORAGE_STATE_PATH });
	await browser.close();
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default async function globalSetup(_config: FullConfig) {
	console.log('\n🔧 E2E Setup: Preparing test data...\n');

	await cleanup();

	for (const project of E2E_PROJECTS) {
		const users = getTestUsers(project);
		const orgName = getOrgName(project);

		console.log(`\nSetting up project: ${project}`);

		for (const [role, user] of Object.entries(users)) {
			await signUpUser(user);
			await verifyUserEmail(user.email);
			console.log(`  ✓ ${user.email} (${role})`);
		}

		const wabaId = project === 'whatsapp-accounts' ? null : E2E_MOCK_WABA_ID;
		const org = await createOrganization(
			users.owner.email,
			orgName,
			[
				{ email: users.admin.email, role: 'admin' },
				{ email: users.member.email, role: 'member' }
			],
			wabaId
		);
		console.log(`  ✓ Organization created: ${org.id} (${orgName})`);
	}

	await saveCookieConsentState();

	console.log('\n✅ Setup complete!\n');
}
