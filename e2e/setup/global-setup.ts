import { chromium, request } from '@playwright/test';
import { getTestUsers, signUpUser, verifyUserEmail, type UserRole } from '../helpers/auth';
import { AUTH_DIR, authStoragePath } from '../helpers/auth-storage';
import {
	BASE_URL,
	E2E_MOCK_WABA_ID,
	E2E_PROJECTS,
	getOrgName,
	type E2EProject
} from '../helpers/config';
import path from 'path';
import fs from 'fs';

const PROJECTS_WITH_AUTH_STORAGE: E2EProject[] = [
	'community',
	'events',
	'petitions',
	'communications',
	'settings',
	'whatsapp-accounts'
];

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
	const useBelcodaDomain =
		url.hostname.endsWith('belcoda.com') && !url.hostname.includes('localhost');
	const consentDomains = useBelcodaDomain ? ['.belcoda.com'] : [url.hostname, `.${url.hostname}`];
	await context.addCookies(
		consentDomains.map((domain) => ({
			name: 'belcoda_cookie_consent',
			value: 'accepted',
			domain,
			path: '/',
			sameSite: 'Lax' as const,
			secure: url.protocol === 'https:',
			httpOnly: false
		}))
	);
	ensureAuthDir();
	await context.storageState({ path: STORAGE_STATE_PATH });
	await browser.close();
}

function ensureAuthDir() {
	if (!fs.existsSync(AUTH_DIR)) {
		fs.mkdirSync(AUTH_DIR, { recursive: true });
	}
}

async function saveRoleStorageState(project: E2EProject, role: UserRole) {
	const user = getTestUsers(project)[role];
	const apiContext = await request.newContext({
		baseURL: BASE_URL,
		storageState: STORAGE_STATE_PATH
	});

	const signInResponse = await apiContext.post('/api/auth/sign-in/email', {
		headers: { 'Content-Type': 'application/json', origin: BASE_URL },
		data: JSON.stringify({ email: user.email, password: user.password })
	});

	if (!signInResponse.ok()) {
		throw new Error(
			`Failed to sign in ${user.email}: ${signInResponse.status()} ${await signInResponse.text()}`
		);
	}

	await apiContext.storageState({ path: authStoragePath(project, role) });
	await apiContext.dispose();

	const saved = JSON.parse(fs.readFileSync(authStoragePath(project, role), 'utf-8')) as {
		cookies: Array<{ name: string }>;
	};
	const hasSession = saved.cookies.some((c) => c.name.includes('session_token'));
	if (!hasSession) {
		throw new Error(`Storage state for ${project}-${role} is missing a session_token cookie`);
	}

	console.log(`  ✓ Storage state: ${project}-${role}`);
}

async function saveAuthStorageStates() {
	console.log('\n  Saving authenticated storage states...');
	ensureAuthDir();
	for (const project of PROJECTS_WITH_AUTH_STORAGE) {
		for (const role of ['owner', 'admin', 'member'] as const) {
			await saveRoleStorageState(project, role);
		}
	}
}

async function runE2eGlobalSetup() {
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
	await saveAuthStorageStates();

	console.log('\n✅ Setup complete!\n');
}

export default async function globalSetup() {
	await runE2eGlobalSetup();
}
