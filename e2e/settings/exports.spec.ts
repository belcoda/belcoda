import { expect, test, type Page } from '@playwright/test';
import { LoginPage } from '../pages/login.page';
import { CommunityPage } from '../pages/community/community.page';
import { ExportsPage } from '../pages/settings/exports.page';
import { getTestUsers } from '../helpers/auth';

const PROJECT = 'settings' as const;
const USERS = getTestUsers(PROJECT);

async function loginAsOwner(page: Page) {
	const loginPage = new LoginPage(page);
	const communityPage = new CommunityPage(page);
	await loginPage.goto();
	await loginPage.login(USERS.owner.email, USERS.owner.password);
	await expect(page).toHaveURL('/community');
	await communityPage.expectLoaded();
}

async function loginAsAdmin(page: Page) {
	const loginPage = new LoginPage(page);
	const communityPage = new CommunityPage(page);
	await loginPage.goto();
	await loginPage.login(USERS.admin.email, USERS.admin.password);
	await expect(page).toHaveURL('/community');
	await communityPage.expectLoaded();
}

async function loginAsMember(page: Page) {
	const loginPage = new LoginPage(page);
	const communityPage = new CommunityPage(page);
	await loginPage.goto();
	await loginPage.login(USERS.member.email, USERS.member.password);
	await expect(page).toHaveURL('/community');
	await communityPage.expectLoaded();
}

test.describe.serial('Settings: People Exports', () => {
	test('owner can navigate to exports page via sidebar', async ({ page }) => {
		const exportsPage = new ExportsPage(page);

		await loginAsOwner(page);
		await page.goto('/settings');

		await exportsPage.settingsSidebarExportsLink.click();
		await expect(page).toHaveURL('/settings/people/exports');
	});

	test('exports page shows not-yet-supported message', async ({ page }) => {
		const exportsPage = new ExportsPage(page);

		await loginAsOwner(page);
		await exportsPage.goto();

		await expect(exportsPage.emptyState).toBeVisible({ timeout: 15_000 });
		await expect(page.getByText(/exports are not currently supported/i)).toBeVisible();
	});

	test('admin can access exports page', async ({ page }) => {
		const exportsPage = new ExportsPage(page);

		await loginAsAdmin(page);
		await exportsPage.goto();

		await expect(exportsPage.emptyState).toBeVisible({ timeout: 15_000 });
	});

	test('member cannot access exports page', async ({ page }) => {
		const exportsPage = new ExportsPage(page);

		await loginAsMember(page);
		await exportsPage.goto();

		await expect(page.getByText(/not authorized|unauthorized/i)).toBeVisible({ timeout: 15_000 });
		await expect(exportsPage.emptyState).toHaveCount(0);
	});
});
