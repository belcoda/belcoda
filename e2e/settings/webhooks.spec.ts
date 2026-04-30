import { expect, test, type Page } from '@playwright/test';
import { LoginPage } from '../pages/login.page';
import { CommunityPage } from '../pages/community/community.page';
import { WebhooksPage } from '../pages/settings/webhooks.page';
import { TEST_USERS } from '../helpers/auth';

async function loginAsOwner(page: Page) {
	const loginPage = new LoginPage(page);
	const communityPage = new CommunityPage(page);
	await loginPage.goto();
	await loginPage.login(TEST_USERS.owner.email, TEST_USERS.owner.password);
	await expect(page).toHaveURL('/community');
	await communityPage.expectLoaded();
}

test.describe.serial('Settings: Webhooks', () => {
	const state = {
		webhookId: '',
		name: '',
		targetUrl: ''
	};

	test('owner can create a webhook', async ({ page }) => {
		const webhooksPage = new WebhooksPage(page);
		const suffix = Date.now();
		state.name = `E2E Webhook ${suffix}`;
		state.targetUrl = `https://example.com/e2e/webhook/${suffix}`;

		await loginAsOwner(page);
		await webhooksPage.goto();
		await webhooksPage.createWebhook(state.name, state.targetUrl);

		await expect(webhooksPage.webhookRow(state.name, state.targetUrl)).toBeVisible({
			timeout: 15_000
		});
		state.webhookId =
			(await webhooksPage
				.webhookRow(state.name, state.targetUrl)
				.getAttribute('data-webhook-id')) ?? '';
		expect(state.webhookId).not.toBe('');

		await webhooksPage.openViewSecretById(state.webhookId);
		await expect(webhooksPage.secretValueInput).toBeVisible({ timeout: 15_000 });
		await expect(webhooksPage.secretValueInput).not.toHaveValue('', { timeout: 15_000 });
	});

	test('owner can update webhook name and target URL', async ({ page }) => {
		const webhooksPage = new WebhooksPage(page);
		const updatedUrl = `https://example.com/e2e/webhook/updated/${Date.now()}`;
		const updatedName = `${state.name} updated`;

		await loginAsOwner(page);
		await webhooksPage.goto();
		await webhooksPage.editWebhookById(state.webhookId, {
			name: updatedName,
			targetUrl: updatedUrl
		});
		state.name = updatedName;
		state.targetUrl = updatedUrl;

		await expect(webhooksPage.webhookRowById(state.webhookId)).toBeVisible({
			timeout: 15_000
		});
		await expect(webhooksPage.webhookRowById(state.webhookId)).toContainText(updatedName);
		await expect(webhooksPage.webhookRowById(state.webhookId)).toContainText(updatedUrl);
	});

	test('owner can delete a webhook', async ({ page }) => {
		const webhooksPage = new WebhooksPage(page);

		await loginAsOwner(page);
		await webhooksPage.goto();

		await webhooksPage.deleteWebhookById(state.webhookId);
		await expect(webhooksPage.webhookRowById(state.webhookId)).toHaveCount(0, {
			timeout: 15_000
		});
	});
});
