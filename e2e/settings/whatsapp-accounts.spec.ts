import { expect, test } from '@playwright/test';
import { WhatsappAccountsPage } from '../pages/settings/whatsapp-accounts.page';
import { loginAsOwner, loginAsMember } from '../helpers/login';
import { expectMemberCannotAccessSettings } from '../helpers/settings-access';

const PROJECT = 'whatsapp-accounts' as const;

test.describe.serial('Settings: WhatsApp accounts', () => {
	test('member cannot access WhatsApp accounts settings', async ({ page }) => {
		await loginAsMember(page, PROJECT);

		await page.goto('/settings/whatsapp/accounts');
		await expectMemberCannotAccessSettings(page);
	});

	test('owner sees activate card when no account is connected', async ({ page }) => {
		await loginAsOwner(page, PROJECT);

		const accountsPage = new WhatsappAccountsPage(page);
		await accountsPage.goto();

		await expect(accountsPage.heading()).toBeVisible();
		await expect(accountsPage.activateCard()).toBeVisible({ timeout: 20_000 });
		await expect(accountsPage.activatedCard()).toHaveCount(0);
	});

	test('owner can connect a WhatsApp account', async ({ page }) => {
		await loginAsOwner(page, PROJECT);

		const accountsPage = new WhatsappAccountsPage(page);
		await accountsPage.goto();

		await expect(accountsPage.activateCard()).toBeVisible({ timeout: 20_000 });
		await Promise.all([
			page.waitForEvent('framenavigated', {
				predicate: (frame) => frame === page.mainFrame()
			}),
			accountsPage.launchSignupButton().click()
		]);

		await expect(accountsPage.activatedCard()).toBeVisible({ timeout: 20_000 });
		await expect(accountsPage.activatedCard()).toContainText('Mock Business');
	});

	test('owner reaches page via settings sidebar', async ({ page }) => {
		await loginAsOwner(page, PROJECT);

		await page.goto('/settings/tags');
		await page.getByTestId('settings-sidebar-whatsapp-accounts').click();

		await expect(page).toHaveURL(/\/settings\/whatsapp\/accounts\/?$/);
		const accountsPage = new WhatsappAccountsPage(page);
		await expect(accountsPage.heading()).toBeVisible();
		await expect(accountsPage.activatedCard()).toBeVisible({ timeout: 20_000 });
	});
});
