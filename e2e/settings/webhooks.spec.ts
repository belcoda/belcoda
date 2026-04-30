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

async function loginAsAdmin(page: Page) {
	const loginPage = new LoginPage(page);
	const communityPage = new CommunityPage(page);
	await loginPage.goto();
	await loginPage.login(TEST_USERS.admin.email, TEST_USERS.admin.password);
	await expect(page).toHaveURL('/community');
	await communityPage.expectLoaded();
}

async function loginAsMember(page: Page) {
	const loginPage = new LoginPage(page);
	const communityPage = new CommunityPage(page);
	await loginPage.goto();
	await loginPage.login(TEST_USERS.member.email, TEST_USERS.member.password);
	await expect(page).toHaveURL('/community');
	await communityPage.expectLoaded();
}

test.describe.serial('Settings: Webhooks', () => {
	const state = {
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
		await webhooksPage.openViewSecret(state.name, state.targetUrl);
		await expect(webhooksPage.secretValueInput).toBeVisible({ timeout: 15_000 });
		await expect(webhooksPage.secretValueInput).not.toHaveValue('', { timeout: 15_000 });
	});

	test('owner can update webhook name and target URL', async ({ page }) => {
		const webhooksPage = new WebhooksPage(page);
		const updatedUrl = `https://example.com/e2e/webhook/updated/${Date.now()}`;
		const updatedName = `${state.name} updated`;

		await loginAsOwner(page);
		await webhooksPage.goto();
		await webhooksPage.editWebhook(state.name, state.targetUrl, {
			name: updatedName,
			targetUrl: updatedUrl
		});
		state.name = updatedName;
		state.targetUrl = updatedUrl;

		await expect(webhooksPage.webhookRow(updatedName, updatedUrl)).toBeVisible({
			timeout: 15_000
		});
	});

	test('owner can delete a webhook', async ({ page }) => {
		const webhooksPage = new WebhooksPage(page);

		await loginAsOwner(page);
		await webhooksPage.goto();

		page.once('dialog', (dialog) => dialog.accept());
		await webhooksPage.deleteWebhook(state.name, state.targetUrl);

		await expect(webhooksPage.webhookRow(state.name, state.targetUrl)).toHaveCount(0, {
			timeout: 15_000
		});
	});

	test('admin cannot create a webhook', async ({ page }) => {
		const webhooksPage = new WebhooksPage(page);
		const suffix = Date.now();
		const webhookName = `E2E Admin Webhook ${suffix}`;
		const webhookUrl = `https://example.com/e2e/admin-webhook/${suffix}`;

		await loginAsAdmin(page);
		await webhooksPage.goto();
		await webhooksPage.createWebhook(webhookName, webhookUrl);

		await expect(page.getByText(/not authorized|unauthorized/i)).toBeVisible({ timeout: 15_000 });
		await expect(webhooksPage.webhookRow(webhookName, webhookUrl)).toHaveCount(0, {
			timeout: 15_000
		});
	});

	test('member cannot create a webhook', async ({ page }) => {
		const webhooksPage = new WebhooksPage(page);
		const suffix = Date.now();
		const webhookName = `E2E Member Webhook ${suffix}`;
		const webhookUrl = `https://example.com/e2e/member-webhook/${suffix}`;

		await loginAsMember(page);
		await webhooksPage.goto();
		await webhooksPage.createWebhook(webhookName, webhookUrl);

		await expect(page.getByText(/not authorized|unauthorized/i)).toBeVisible({ timeout: 15_000 });
		await expect(webhooksPage.webhookRow(webhookName, webhookUrl)).toHaveCount(0, {
			timeout: 15_000
		});
	});

	test('admin cannot update a webhook', async ({ page }) => {
		const webhooksPage = new WebhooksPage(page);
		const updatedUrl = `https://example.com/e2e/admin-webhook/updated/${Date.now()}`;

		await loginAsAdmin(page);
		await webhooksPage.goto();
		await webhooksPage.editWebhook(state.name, state.targetUrl, {
			name: state.name,
			targetUrl: updatedUrl
		});

		await expect(page.getByText(/not authorized|unauthorized/i)).toBeVisible({ timeout: 15_000 });
	});

	test('member cannot update a webhook', async ({ page }) => {
		const webhooksPage = new WebhooksPage(page);
		const updatedUrl = `https://example.com/e2e/member-webhook/updated/${Date.now()}`;

		await loginAsMember(page);
		await webhooksPage.goto();
		await webhooksPage.editWebhook(state.name, state.targetUrl, {
			name: state.name,
			targetUrl: updatedUrl
		});

		await expect(page.getByText(/not authorized|unauthorized/i)).toBeVisible({ timeout: 15_000 });
	});

	test('admin cannot delete a webhook', async ({ page }) => {
		const webhooksPage = new WebhooksPage(page);

		await loginAsAdmin(page);
		await webhooksPage.goto();

		page.once('dialog', (dialog) => dialog.accept());
		await webhooksPage.deleteWebhook(state.name, state.targetUrl);

		await expect(page.getByText(/not authorized|unauthorized/i)).toBeVisible({ timeout: 15_000 });
		await expect(webhooksPage.webhookRow(state.name, state.targetUrl)).toHaveCount(1, {
			timeout: 15_000
		});
	});

	test('member cannot delete a webhook', async ({ page }) => {
		const webhooksPage = new WebhooksPage(page);

		await loginAsMember(page);
		await webhooksPage.goto();

		page.once('dialog', (dialog) => dialog.accept());
		await webhooksPage.deleteWebhook(state.name, state.targetUrl);

		await expect(page.getByText(/not authorized|unauthorized/i)).toBeVisible({ timeout: 15_000 });
		await expect(webhooksPage.webhookRow(state.name, state.targetUrl)).toHaveCount(1, {
			timeout: 15_000
		});
	});
});
