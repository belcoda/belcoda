import { expect, type Page } from '@playwright/test';
import { LoginPage } from '../pages/login.page';
import { CommunityPage } from '../pages/community/community.page';
import { getTestUsers, type UserRole } from './auth';
import type { E2EProject } from './config';

const NAVIGATION_TIMEOUT = 60_000;

export async function signOut(page: Page) {
	await page.goto('/logout', { waitUntil: 'commit', timeout: NAVIGATION_TIMEOUT });
	await page.waitForURL(/\/(login|signup)/, {
		timeout: NAVIGATION_TIMEOUT,
		waitUntil: 'commit'
	});
}

async function loginViaForm(page: Page, email: string, password: string, waitForLoad = false) {
	const loginPage = new LoginPage(page);
	const communityPage = new CommunityPage(page);
	await loginPage.goto();
	await loginPage.login(email, password);
	await expect(page).toHaveURL(/\/community/, { timeout: 30_000 });
	if (waitForLoad) {
		await communityPage.expectLoaded();
	}
	return communityPage;
}

async function hasAuthoritativeSession(page: Page): Promise<boolean> {
	const response = await page.request.get('/api/auth/get-session?disableCookieCache=true');
	if (!response.ok()) return false;
	const session = await response.json().catch(() => null);
	return !!session?.user?.id;
}

export async function ensureAuthenticated(
	page: Page,
	project: E2EProject,
	role: UserRole = 'owner',
	waitForCommunityLoad = true
): Promise<CommunityPage> {
	const communityPage = new CommunityPage(page);
	await page.goto('/community', { waitUntil: 'commit', timeout: NAVIGATION_TIMEOUT });

	if (/\/(login|signup)/.test(page.url())) {
		const user = getTestUsers(project)[role];
		return loginViaForm(page, user.email, user.password, waitForCommunityLoad);
	}

	if (!(await hasAuthoritativeSession(page))) {
		const user = getTestUsers(project)[role];
		await signOut(page);
		await loginViaForm(page, user.email, user.password, waitForCommunityLoad);
		return communityPage;
	}

	if (!page.url().includes('/community')) {
		await expect(page).toHaveURL(/\/community/, { timeout: 30_000 });
	}

	if (waitForCommunityLoad) {
		await communityPage.expectLoaded();
	}
	return communityPage;
}

export async function loginAsOwner(page: Page, project: E2EProject) {
	await ensureAuthenticated(page, project, 'owner', false);
}

export async function loginAsAdmin(page: Page, project: E2EProject) {
	const { admin } = getTestUsers(project);
	await signOut(page);
	await loginViaForm(page, admin.email, admin.password, true);
}

export async function loginAsMember(page: Page, project: E2EProject) {
	const { member } = getTestUsers(project);
	await signOut(page);
	await loginViaForm(page, member.email, member.password, true);
}

export async function gotoCommunitySettings(page: Page, project: E2EProject) {
	const communityPage = await ensureAuthenticated(page, project, 'owner');
	await communityPage.openOrgMenu();
	await communityPage.clickSettings();
	await expect(page).toHaveURL('/settings');
}
