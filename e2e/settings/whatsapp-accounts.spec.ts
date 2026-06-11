import { expect, test } from '@playwright/test';
import { WhatsappAccountsPage } from '../pages/settings/whatsapp-accounts.page';
import { loginAsOwner, loginAsMember } from '../helpers/login';
import { expectMemberCannotAccessSettings } from '../helpers/settings-access';
import {
	E2E_EMBEDDED_SIGNUP_PHONE_NUMBER,
	E2E_EMBEDDED_SIGNUP_PHONE_NUMBER_ID,
	E2E_EMBEDDED_SIGNUP_WABA_ID
} from '../helpers/config';

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
		await accountsPage.launchSignupButton().click();
		await accountsPage.completeEmbeddedSignup({
			phoneNumberId: E2E_EMBEDDED_SIGNUP_PHONE_NUMBER_ID,
			wabaId: E2E_EMBEDDED_SIGNUP_WABA_ID
		});

		await expect(accountsPage.activatedCard()).toBeVisible({ timeout: 20_000 });
		await expect(accountsPage.phoneLine()).toContainText(E2E_EMBEDDED_SIGNUP_PHONE_NUMBER);
		await expect(accountsPage.wabaLine()).toContainText(E2E_EMBEDDED_SIGNUP_WABA_ID);
		await expect
			.poll(
				async () => {
					await page.reload();
					try {
						await accountsPage.heading().waitFor({ state: 'visible', timeout: 5_000 });
					} catch {
						return 0;
					}
					return accountsPage.activatedCard().count();
				},
				{ timeout: 20_000 }
			)
			.toBe(1);
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
