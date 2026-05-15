import { expect, test, type Page } from '@playwright/test';
import { LoginPage } from '../pages/login.page';
import { CommunityPage } from '../pages/community/community.page';
import { OrgConfigPage, OrgThemesPage } from '../pages/settings/organization.page';
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

test.describe('Settings: Organization Configuration', () => {
	test('owner can navigate to configuration page via sidebar', async ({ page }) => {
		await loginAsOwner(page);
		await page.goto('/settings');
		await page.getByTestId('settings-sidebar-configuration').click();
		await expect(page).toHaveURL('/settings/organization/configuration');
	});

	test('owner sees the configuration form', async ({ page }) => {
		const configPage = new OrgConfigPage(page);
		await loginAsOwner(page);
		await configPage.goto();
		await expect(configPage.configCard).toBeVisible({ timeout: 15_000 });
		await expect(configPage.saveButton).toBeVisible();
		await expect(configPage.cancelButton).toBeVisible();
	});

	test('admin can access configuration page', async ({ page }) => {
		const configPage = new OrgConfigPage(page);
		await loginAsAdmin(page);
		await configPage.goto();
		await expect(configPage.configCard).toBeVisible({ timeout: 15_000 });
	});

	test('owner can save configuration and return to /settings', async ({ page }) => {
		const configPage = new OrgConfigPage(page);
		await loginAsOwner(page);
		await configPage.goto();
		await expect(configPage.configCard).toBeVisible({ timeout: 15_000 });
		await configPage.saveButton.click();
		await expect(page).toHaveURL('/settings', { timeout: 15_000 });
	});
});

test.describe('Settings: Organization Themes', () => {
	test('owner can navigate to themes page via sidebar', async ({ page }) => {
		await loginAsOwner(page);
		await page.goto('/settings');
		await page.getByTestId('settings-sidebar-themes').click();
		await expect(page).toHaveURL('/settings/organization/themes');
	});

	test('owner sees the themes form with save button', async ({ page }) => {
		const themesPage = new OrgThemesPage(page);
		await loginAsOwner(page);
		await themesPage.goto();
		await expect(themesPage.themesForm).toBeVisible({ timeout: 15_000 });
		await expect(themesPage.saveButton).toBeVisible();
		await expect(themesPage.cancelButton).toBeVisible();
	});

	test('admin can access themes page', async ({ page }) => {
		const themesPage = new OrgThemesPage(page);
		await loginAsAdmin(page);
		await themesPage.goto();
		await expect(themesPage.themesForm).toBeVisible({ timeout: 15_000 });
	});

	test('owner can save themes and return to /settings', async ({ page }) => {
		const themesPage = new OrgThemesPage(page);
		await loginAsOwner(page);
		await themesPage.goto();
		await expect(themesPage.themesForm).toBeVisible({ timeout: 15_000 });
		await themesPage.saveButton.click();
		await expect(page).toHaveURL('/settings', { timeout: 15_000 });
	});
});
