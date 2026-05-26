import { expect, test } from '@playwright/test';
import { ExportsPage } from '../pages/settings/exports.page';
import { loginAsOwner, loginAsAdmin, loginAsMember } from '../helpers/login';
import { expectMemberCannotAccessSettings } from '../helpers/settings-access';

const PROJECT = 'settings' as const;

test.describe.serial('Settings: People Exports', () => {
	test('owner can navigate to exports page via sidebar', async ({ page }) => {
		const exportsPage = new ExportsPage(page);

		await loginAsOwner(page, PROJECT);
		await page.goto('/settings');

		await exportsPage.settingsSidebarExportsLink.click();
		await expect(page).toHaveURL('/settings/people/exports');
	});

	test('exports page shows not-yet-supported message', async ({ page }) => {
		const exportsPage = new ExportsPage(page);

		await loginAsOwner(page, PROJECT);
		await exportsPage.goto();

		await expect(exportsPage.emptyState).toBeVisible({ timeout: 15_000 });
		await expect(page.getByText(/exports are not currently supported/i)).toBeVisible();
	});

	test('admin can access exports page', async ({ page }) => {
		const exportsPage = new ExportsPage(page);

		await loginAsAdmin(page, PROJECT);
		await exportsPage.goto();

		await expect(exportsPage.emptyState).toBeVisible({ timeout: 15_000 });
	});

	test('member cannot access exports page', async ({ page }) => {
		const exportsPage = new ExportsPage(page);

		await loginAsMember(page, PROJECT);
		await exportsPage.goto();

		await expectMemberCannotAccessSettings(page);
		await expect(exportsPage.emptyState).toHaveCount(0);
	});
});
