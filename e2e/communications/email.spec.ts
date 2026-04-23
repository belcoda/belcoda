import { expect, test, type Page } from '@playwright/test';
import { LoginPage } from '../pages/login.page';
import { CommunityPage } from '../pages/community/community.page';
import { EmailNavigationPage } from '../pages/communications/email-navigation.page';
import { EmailDraftPage } from '../pages/communications/email-draft.page';
import { TEST_USERS } from '../helpers/auth';

async function loginAsOwner(page: Page) {
	const loginPage = new LoginPage(page);
	const communityPage = new CommunityPage(page);
	await loginPage.goto();
	await loginPage.login(TEST_USERS.owner.email, TEST_USERS.owner.password);
	await expect(page).toHaveURL('/community');
	await communityPage.expectLoaded();
}

test.describe.serial('Communications: Email Drafts', () => {
	const state = {
		draftId: '',
		subject: '',
		body: ''
	};

	test('owner can compose and save an email draft', async ({ page }) => {
		const suffix = Date.now();
		state.subject = `E2E Email Draft ${suffix}`;
		state.body = `E2E Email Body ${suffix}`;

		await loginAsOwner(page);

		const navigationPage = new EmailNavigationPage(page);
		await navigationPage.gotoDrafts();
		await navigationPage.clickComposeEmail();

		const draftPage = new EmailDraftPage(page);
		await draftPage.waitForLoaded();
		await draftPage.fillSubject(state.subject);
		await draftPage.fillBody(state.body);
		await draftPage.save();

		await expect(page.getByText('Email saved')).toBeVisible({ timeout: 10_000 });
		await expect(page).toHaveURL(/\/communications\/email\/drafts\/[0-9a-f-]{36}$/i);

		state.draftId = new URL(page.url()).pathname.split('/').at(-1) ?? '';
		expect(state.draftId).not.toBe('');
	});

	test('owner sees subject and body persisted on draft reload', async ({ page }) => {
		await loginAsOwner(page);

		const draftPage = new EmailDraftPage(page);
		await draftPage.gotoDraftById(state.draftId);
		await draftPage.waitForLoaded();

		await expect(draftPage.subjectInput).toHaveValue(state.subject, { timeout: 10_000 });
		await expect(draftPage.bodyEditor).toContainText(state.body, { timeout: 10_000 });
	});

	test('owner can discard an email draft', async ({ page }) => {
		await loginAsOwner(page);

		const draftPage = new EmailDraftPage(page);
		await draftPage.gotoDraftById(state.draftId);
		await draftPage.waitForLoaded();
		await draftPage.discardAndConfirm();

		await expect(page).toHaveURL('/communications/email/drafts', { timeout: 10_000 });
	});

	test('owner can send an email draft', async ({ page }) => {
		const suffix = Date.now();

		await loginAsOwner(page);

		const draftPage = new EmailDraftPage(page);
		await draftPage.gotoNewDraft();
		await draftPage.waitForLoaded();
		await draftPage.fillSubject(`E2E Send Email ${suffix}`);
		await draftPage.fillBody(`E2E Send Body ${suffix}`);
		await draftPage.send();

		await expect(page).toHaveURL('/communications/email/sent', { timeout: 15_000 });
	});
});
