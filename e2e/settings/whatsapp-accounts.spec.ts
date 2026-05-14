import { expect, test, type Page } from '@playwright/test';
import { LoginPage } from '../pages/login.page';
import { CommunityPage } from '../pages/community/community.page';
import { WhatsappAccountsPage } from '../pages/settings/whatsapp-accounts.page';
import { getTestUsers } from '../helpers/auth';
import {
	E2E_EMBEDDED_SIGNUP_PHONE_NUMBER_ID,
	E2E_EMBEDDED_SIGNUP_WABA_ID
} from '../helpers/config';

const PROJECT = 'whatsapp-accounts' as const;
const USERS = getTestUsers(PROJECT);

async function loginAsOwner(page: Page) {
	const loginPage = new LoginPage(page);
	const communityPage = new CommunityPage(page);
	await loginPage.goto();
	await loginPage.login(USERS.owner.email, USERS.owner.password);
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

test.describe.serial('Settings: WhatsApp accounts', () => {
	test('member cannot access WhatsApp accounts settings', async ({ page }) => {
		await loginAsMember(page);

		await page.goto('/settings/whatsapp/accounts');

		await expect(page.getByTestId('whatsapp-accounts-heading')).toHaveCount(0);
		await expect(page.getByTestId('whatsapp-accounts-launch-signup')).toHaveCount(0);
	});

	test('owner sees activate card when no account is connected', async ({ page }) => {
		await loginAsOwner(page);

		const accountsPage = new WhatsappAccountsPage(page);
		await accountsPage.goto();

		await expect(accountsPage.heading()).toBeVisible();
		await expect(accountsPage.activateCard()).toBeVisible({ timeout: 20_000 });
		await expect(accountsPage.activatedCard()).toHaveCount(0);
	});

	test('owner can connect a WhatsApp account', async ({ page }) => {
		await loginAsOwner(page);

		const accountsPage = new WhatsappAccountsPage(page);
		await accountsPage.goto();

		await expect(accountsPage.activateCard()).toBeVisible({ timeout: 20_000 });
		await accountsPage.launchSignupButton().click();
		await accountsPage.completeEmbeddedSignup({
			phoneNumberId: E2E_EMBEDDED_SIGNUP_PHONE_NUMBER_ID,
			wabaId: E2E_EMBEDDED_SIGNUP_WABA_ID
		});

		await expect(accountsPage.activatedCard()).toBeVisible({ timeout: 20_000 });
		await expect(accountsPage.phoneLine()).toContainText(E2E_EMBEDDED_SIGNUP_PHONE_NUMBER_ID);
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
		await loginAsOwner(page);

		await page.goto('/settings/tags');
		await page.getByTestId('settings-sidebar-whatsapp-accounts').click();

		await expect(page).toHaveURL(/\/settings\/whatsapp\/accounts\/?$/);
		const accountsPage = new WhatsappAccountsPage(page);
		await expect(accountsPage.heading()).toBeVisible();
		await expect(accountsPage.activatedCard()).toBeVisible({ timeout: 20_000 });
	});
});
