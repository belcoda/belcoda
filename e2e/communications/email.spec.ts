import { expect, test } from '@playwright/test';
import { EmailListPage, EmailNavigationPage } from '../pages/communications/email-navigation.page';
import { EmailDraftPage } from '../pages/communications/email-draft.page';
import { EmailSentPage } from '../pages/communications/email-sent.page';
import { BASE_URL, getOrgSlug } from '../helpers/config';
import { loginAsOwner } from '../helpers/login';

const PROJECT = 'communications' as const;

test('owner can load more email drafts via infinite scroll', async ({ page, request }) => {
	const seedResponse = await request.post(`${BASE_URL}/api/e2e/seed-email-messages`, {
		data: { count: 30, organizationSlug: getOrgSlug(PROJECT) }
	});
	expect(seedResponse.ok()).toBeTruthy();
	const { runId } = (await seedResponse.json()) as { runId: string };

	await loginAsOwner(page, PROJECT);

	const navigationPage = new EmailNavigationPage(page);
	await navigationPage.gotoDrafts();

	const listPage = new EmailListPage(page);
	await listPage.waitForListVisible();

	const seededRows = listPage.emailItemsForRun(runId);
	await expect(seededRows.first()).toBeVisible({ timeout: 15_000 });

	const initialCount = await seededRows.count();
	expect(initialCount).toBeGreaterThan(0);
	expect(initialCount).toBeLessThan(30);

	await expect(async () => {
		await listPage.scrollToBottom();
		await expect(seededRows).toHaveCount(30);
	}).toPass({ timeout: 15_000 });
});

test.describe.serial('Communications: Email Drafts', () => {
	const state = {
		draftId: '',
		subject: '',
		body: '',
		sentSubject: '',
		sentBody: ''
	};

	test('owner can compose and save an email draft', async ({ page }) => {
		const suffix = Date.now();
		state.subject = `E2E Email Draft ${suffix}`;
		state.body = `E2E Email Body ${suffix}`;

		await loginAsOwner(page, PROJECT);

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
		await loginAsOwner(page, PROJECT);

		const draftPage = new EmailDraftPage(page);
		await draftPage.gotoDraftById(state.draftId);
		await draftPage.waitForLoaded();

		await expect(draftPage.subjectInput).toHaveValue(state.subject, { timeout: 10_000 });
		await expect(draftPage.bodyEditor).toContainText(state.body, { timeout: 10_000 });
	});

	test('owner can discard an email draft', async ({ page }) => {
		await loginAsOwner(page, PROJECT);

		const draftPage = new EmailDraftPage(page);
		await draftPage.gotoDraftById(state.draftId);
		await draftPage.waitForLoaded();
		await draftPage.discardAndConfirm();

		await expect(page).toHaveURL('/communications/email/drafts', { timeout: 10_000 });
	});

	test('owner can send an email draft', async ({ page }) => {
		const suffix = Date.now();
		state.sentSubject = `E2E Send Email ${suffix}`;
		state.sentBody = `E2E Send Body ${suffix}`;

		await loginAsOwner(page, PROJECT);

		const draftPage = new EmailDraftPage(page);
		await draftPage.gotoNewDraft();
		await draftPage.waitForLoaded();
		await draftPage.fillSubject(state.sentSubject);
		await draftPage.fillBody(state.sentBody);

		await draftPage.selectEveryoneRecipient();
		await draftPage.save();
		await draftPage.send();

		await expect(page).toHaveURL('/communications/email/sent', { timeout: 15_000 });

		const sentPage = new EmailSentPage(page);
		await sentPage.waitForList();
		await sentPage.openSentItemBySubject(state.sentSubject);

		await expect(page).toHaveURL(/\/communications\/email\/sent\/[0-9a-f-]{36}$/i, {
			timeout: 15_000
		});

		await sentPage.waitForDetail();
		await expect(sentPage.detailSubject).toContainText(state.sentSubject, { timeout: 10_000 });
		await expect(sentPage.detailMessage).toContainText(state.sentBody, { timeout: 15_000 });
	});
});
