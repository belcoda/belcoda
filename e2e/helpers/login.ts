import { expect, type Page } from '@playwright/test';
import { LoginPage } from '../pages/login.page';
import { CommunityPage } from '../pages/community/community.page';
import { getTestUsers, type UserRole } from './auth';
import type { E2EProject } from './config';

export async function signOut(page: Page) {
	await page.goto('/logout');
	await page.waitForURL(/\/(login|signup)/, { timeout: 30_000 });
}

async function loginViaForm(page: Page, email: string, password: string) {
	const loginPage = new LoginPage(page);
	const communityPage = new CommunityPage(page);
	await loginPage.goto();
	await loginPage.login(email, password);
	await expect(page).toHaveURL('/community', { timeout: 30_000 });
	await communityPage.expectLoaded();
}

export async function ensureAuthenticated(
	page: Page,
	project: E2EProject,
	role: UserRole = 'owner'
): Promise<CommunityPage> {
	const communityPage = new CommunityPage(page);
	await page.goto('/community');
	const onAuthPage = /\/(login|signup)/.test(page.url());
	if (onAuthPage) {
		const user = getTestUsers(project)[role];
		await loginViaForm(page, user.email, user.password);
	} else {
		await communityPage.expectLoaded();
	}
	return communityPage;
}

export async function loginAsOwner(page: Page, project: E2EProject) {
	await ensureAuthenticated(page, project, 'owner');
}

export async function loginAsAdmin(page: Page, project: E2EProject) {
	const { admin } = getTestUsers(project);
	await signOut(page);
	await loginViaForm(page, admin.email, admin.password);
}

export async function loginAsMember(page: Page, project: E2EProject) {
	const { member } = getTestUsers(project);
	await signOut(page);
	await loginViaForm(page, member.email, member.password);
}

export async function gotoCommunitySettings(page: Page, project: E2EProject) {
	const communityPage = await ensureAuthenticated(page, project, 'owner');
	await communityPage.openOrgMenu();
	await communityPage.clickSettings();
	await expect(page).toHaveURL('/settings');
}
