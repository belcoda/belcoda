import { expect, test, type Page } from '@playwright/test';
import { LoginPage } from '../pages/login.page';
import { CommunityPage } from '../pages/community/community.page';
import {
	WhatsAppDraftPage,
	WhatsAppListPage,
	WhatsAppNavigationPage
} from '../pages/communications/whatsapp.page';
import { TEST_USERS } from '../helpers/auth';

async function loginAsOwner(page: Page) {
	const loginPage = new LoginPage(page);
	const communityPage = new CommunityPage(page);
	await loginPage.goto();
	await loginPage.login(TEST_USERS.owner.email, TEST_USERS.owner.password);
	await expect(page).toHaveURL('/community');
	await communityPage.expectLoaded();
}

test.describe.serial('Communications: WhatsApp', () => {
	const state = {
		threadId: ''
	};

	test('owner can compose a WhatsApp draft and land on detail page', async ({ page }) => {
		await loginAsOwner(page);

		const navigationPage = new WhatsAppNavigationPage(page);
		await navigationPage.gotoDrafts();
		await navigationPage.clickComposeWhatsApp();

		await expect(page).toHaveURL(/\/communications\/whatsapp\/drafts\/[0-9a-f-]{36}$/i, {
			timeout: 20_000
		});

		state.threadId = new URL(page.url()).pathname.split('/').at(-1) ?? '';
		expect(state.threadId).not.toBe('');

		const draftPage = new WhatsAppDraftPage(page);
		await draftPage.waitForLoaded();
	});

	test('owner can save a WhatsApp draft and find it in drafts list', async ({ page }) => {
		await loginAsOwner(page);

		const draftPage = new WhatsAppDraftPage(page);
		await draftPage.gotoDraftById(state.threadId);
		await draftPage.waitForLoaded();
		await draftPage.save();

		const listPage = new WhatsAppListPage(page);
		await listPage.waitForListVisible();
		await expect(listPage.threadRowById(state.threadId)).toBeVisible({ timeout: 20_000 });
	});

	test('owner can send a WhatsApp draft and gets sent detail page', async ({ page }) => {
		await loginAsOwner(page);

		const draftPage = new WhatsAppDraftPage(page);
		await draftPage.gotoDraftById(state.threadId);
		await draftPage.waitForLoaded();
		await draftPage.selectEveryoneRecipient();
		await draftPage.sendAndConfirm();

		await expect(page).toHaveURL(`/communications/whatsapp/sent/${state.threadId}`, {
			timeout: 20_000
		});
	});

	test('owner can open sent WhatsApp thread from sent list', async ({ page }) => {
		await loginAsOwner(page);

		const navigationPage = new WhatsAppNavigationPage(page);
		await navigationPage.gotoSent();

		const listPage = new WhatsAppListPage(page);
		await listPage.waitForListVisible();
		await listPage.openThreadById(state.threadId);

		await expect(page).toHaveURL(`/communications/whatsapp/sent/${state.threadId}`, {
			timeout: 20_000
		});
	});
});
