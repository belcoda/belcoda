import { expect, test } from '@playwright/test';
import { OrgConfigPage, OrgThemesPage } from '../pages/settings/organization.page';
import { loginAsOwner, loginAsAdmin } from '../helpers/login';

const PROJECT = 'settings' as const;

test.describe('Settings: Organization Configuration', () => {
	test('owner can navigate to configuration page via sidebar', async ({ page }) => {
		await loginAsOwner(page, PROJECT);
		await page.goto('/settings');
		await page.getByTestId('settings-sidebar-configuration').click();
		await expect(page).toHaveURL('/settings/organization/configuration');
	});

	test('owner sees the configuration form', async ({ page }) => {
		const configPage = new OrgConfigPage(page);
		await loginAsOwner(page, PROJECT);
		await configPage.goto();
		await expect(configPage.configCard).toBeVisible({ timeout: 15_000 });
		await expect(configPage.saveButton).toBeVisible();
		await expect(configPage.cancelButton).toBeVisible();
	});

	test('admin can access configuration page', async ({ page }) => {
		const configPage = new OrgConfigPage(page);
		await loginAsAdmin(page, PROJECT);
		await configPage.goto();
		await expect(configPage.configCard).toBeVisible({ timeout: 15_000 });
	});

	test('owner can save configuration and return to /settings', async ({ page }) => {
		const configPage = new OrgConfigPage(page);
		await loginAsOwner(page, PROJECT);
		await configPage.goto();
		await expect(configPage.configCard).toBeVisible({ timeout: 15_000 });
		await configPage.saveButton.click();
		await expect(page).toHaveURL('/settings', { timeout: 15_000 });
	});
});

test.describe('Settings: Organization Themes', () => {
	test('owner can navigate to themes page via sidebar', async ({ page }) => {
		await loginAsOwner(page, PROJECT);
		await page.goto('/settings');
		await page.getByTestId('settings-sidebar-themes').click();
		await expect(page).toHaveURL('/settings/organization/themes');
	});

	test('owner sees the themes form with save button', async ({ page }) => {
		const themesPage = new OrgThemesPage(page);
		await loginAsOwner(page, PROJECT);
		await themesPage.goto();
		await expect(themesPage.themesForm).toBeVisible({ timeout: 15_000 });
		await expect(themesPage.saveButton).toBeVisible();
		await expect(themesPage.cancelButton).toBeVisible();
	});

	test('admin can access themes page', async ({ page }) => {
		const themesPage = new OrgThemesPage(page);
		await loginAsAdmin(page, PROJECT);
		await themesPage.goto();
		await expect(themesPage.themesForm).toBeVisible({ timeout: 15_000 });
	});

	test('owner can save themes and return to /settings', async ({ page }) => {
		const themesPage = new OrgThemesPage(page);
		await loginAsOwner(page, PROJECT);
		await themesPage.goto();
		await expect(themesPage.themesForm).toBeVisible({ timeout: 15_000 });
		await Promise.all([
			page.waitForURL('/settings', { timeout: 30_000 }),
			themesPage.saveButton.click()
		]);
	});
});
