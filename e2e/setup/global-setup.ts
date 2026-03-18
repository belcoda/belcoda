import { mkdir } from 'fs/promises';
import { join } from 'path';
import { chromium } from '@playwright/test';
import type { FullConfig } from '@playwright/test';
import {
	TEST_USERS,
	signUpUser,
	signInUser,
	extractSessionCookie,
	verifyUserEmail
} from '../helpers/auth';
import { BASE_URL } from '../helpers/config';

const AUTH_DIR = join(process.cwd(), 'playwright', '.auth');

async function createOrganization(_userEmail: string, orgName: string, sessionToken: string) {
	const response = await fetch(`${BASE_URL}/api/auth/organization/create`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Cookie: `belcoda.session_token=${sessionToken}`
		},
		body: JSON.stringify({
			name: orgName,
			slug: orgName.toLowerCase().replace(/\s+/g, '-'),
			country: 'US',
			defaultLanguage: 'en',
			settings: {}
		})
	});

	if (!response.ok) {
		const error = await response.text();
		if (!error.includes('already exists')) {
			console.log('Create org response:', response.status, error);
		}
		return null;
	}

	return response.json();
}

async function inviteUserToOrganization(
	inviterToken: string,
	organizationId: string,
	inviteEmail: string,
	role: string
) {
	const response = await fetch(`${BASE_URL}/api/auth/organization/invite`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Cookie: `belcoda.session_token=${inviterToken}`
		},
		body: JSON.stringify({
			email: inviteEmail,
			organizationId,
			role
		})
	});

	if (!response.ok) {
		const error = await response.text();
		console.log('Invite response:', response.status, error);
	}

	return response;
}

async function saveStorageState(
	browser: Awaited<ReturnType<typeof chromium.launch>>,
	role: string,
	sessionToken: string
) {
	const context = await browser.newContext();

	await context.addCookies([
		{
			name: 'belcoda.session_token',
			value: sessionToken,
			domain: 'localhost',
			path: '/',
			httpOnly: true,
			secure: false,
			sameSite: 'Lax'
		}
	]);

	const page = await context.newPage();
	await page.goto(`${BASE_URL}/community`);

	try {
		await page.waitForLoadState('networkidle');
		console.log(`✓ Storage state saved for ${role}`);
	} catch {
		console.warn(`⚠ Could not verify login for ${role}, but saving state anyway`);
	}

	const storagePath = join(AUTH_DIR, `${role}.json`);
	await context.storageState({ path: storagePath });

	await context.close();
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default async function globalSetup(_config: FullConfig) {
	console.log('\n🔧 E2E Setup: Creating test users...\n');

	await mkdir(AUTH_DIR, { recursive: true });

	const browser = await chromium.launch();

	try {
		console.log('Signing up test users...');
		for (const [role, user] of Object.entries(TEST_USERS)) {
			await signUpUser(user);
			await verifyUserEmail(user.email);
			console.log(`  ✓ ${user.email} (role: ${role})`);
		}

		console.log('\nSetting up organization...');
		const ownerSignIn = await signInUser(TEST_USERS.owner);
		const ownerToken = extractSessionCookie(ownerSignIn);

		if (!ownerToken) {
			throw new Error('Could not extract owner session token');
		}

		const org = await createOrganization(
			TEST_USERS.owner.email,
			'E2E Test Organization',
			ownerToken
		);

		if (org?.id) {
			console.log(`  ✓ Organization created: ${org.id}`);

			void inviteUserToOrganization(ownerToken, org.id, TEST_USERS.admin.email, 'admin');
			void inviteUserToOrganization(ownerToken, org.id, TEST_USERS.member.email, 'member');

			console.log('\nSaving storage states...');

			await saveStorageState(browser, 'owner', ownerToken);

			const adminSignIn = await signInUser(TEST_USERS.admin);
			const adminToken = extractSessionCookie(adminSignIn);
			if (adminToken) {
				await saveStorageState(browser, 'admin', adminToken);
			}

			const memberSignIn = await signInUser(TEST_USERS.member);
			const memberToken = extractSessionCookie(memberSignIn);
			if (memberToken) {
				await saveStorageState(browser, 'member', memberToken);
			}
		} else {
			console.log('  ℹ Organization may already exist, proceeding with storage states...');
			console.log('\nSaving storage states (existing org)...');

			for (const [role, user] of Object.entries(TEST_USERS)) {
				const signIn = await signInUser(user);
				const token = extractSessionCookie(signIn);
				if (token) {
					await saveStorageState(browser, role, token);
				}
			}
		}

		console.log('\n✅ Setup complete!');
		console.log(`   Storage states saved to: ${AUTH_DIR}`);
	} finally {
		await browser.close();
	}
}
