import { expect, test } from '@playwright/test';
import { WebhooksPage } from '../pages/settings/webhooks.page';
import { loginAsOwner, loginAsAdmin, loginAsMember } from '../helpers/login';
import { expectMemberCannotAccessSettings } from '../helpers/settings-access';

const PROJECT = 'settings' as const;

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

		await loginAsOwner(page, PROJECT);
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

		await loginAsOwner(page, PROJECT);
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

	test('admin can view webhooks but cannot manage them', async ({ page }) => {
		const webhooksPage = new WebhooksPage(page);

		await loginAsAdmin(page, PROJECT);
		await webhooksPage.goto();

		const row = webhooksPage.webhookRow(state.name, state.targetUrl);
		await expect(row).toBeVisible({ timeout: 15_000 });
		await expect(webhooksPage.createWebhookTrigger).toHaveCount(0);
		await expect(row.getByTestId('settings-webhooks-edit')).toHaveCount(0);
		await expect(row.getByTestId('settings-webhooks-delete')).toHaveCount(0);
		await expect(row.getByTestId('settings-webhooks-view-secret')).toHaveCount(0);
	});

	test('member cannot access webhook management', async ({ page }) => {
		const webhooksPage = new WebhooksPage(page);

		await loginAsMember(page, PROJECT);
		await webhooksPage.goto();

		await expectMemberCannotAccessSettings(page);
		await expect(webhooksPage.root).toHaveCount(0);
		await expect(webhooksPage.createWebhookTrigger).toHaveCount(0);
	});

	test('owner can delete a webhook', async ({ page }) => {
		const webhooksPage = new WebhooksPage(page);

		await loginAsOwner(page, PROJECT);
		await webhooksPage.goto();

		await webhooksPage.deleteWebhookById(state.webhookId);
		await expect(webhooksPage.webhookRowById(state.webhookId)).toHaveCount(0, {
			timeout: 15_000
		});
	});
});
