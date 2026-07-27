import { expect, test } from '@playwright/test';
import { WebhooksPage } from '../pages/settings/webhooks.page';
import { TagsPage } from '../pages/settings/tags.page';
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

/**
 * End-to-end delivery test following the simple happy-path:
 *   1. create a webhook subscribed to all events (target is a dummy example.com URL),
 *   2. take an action covered by the webhook (creating a tag fires `tag.created`),
 *   3. open the webhook's delivery logs and confirm the delivery was recorded.
 *
 * Delivery runs asynchronously through the background (pg-boss) queue and is then
 * synced back to the client via Zero, so the log assertion polls with a generous
 * timeout. The recorded status may be `success` or `failed` depending on how the
 * dummy endpoint responds (or whether it's reachable) — either way a log row is
 * written, which is what proves the webhook fired.
 */
test.describe.serial('Settings: Webhook delivery', () => {
	const state = {
		webhookId: '',
		name: '',
		targetUrl: '',
		tagName: ''
	};

	test('owner can create a webhook to observe deliveries', async ({ page }) => {
		const webhooksPage = new WebhooksPage(page);
		const suffix = Date.now();
		state.name = `E2E Delivery Webhook ${suffix}`;
		state.targetUrl = `https://example.com/e2e/webhook/delivery/${suffix}`;

		await loginAsOwner(page, PROJECT);
		await webhooksPage.goto();
		await webhooksPage.createWebhook(state.name, state.targetUrl);

		const row = webhooksPage.webhookRow(state.name, state.targetUrl);
		await expect(row).toBeVisible({ timeout: 15_000 });
		state.webhookId = (await row.getAttribute('data-webhook-id')) ?? '';
		expect(state.webhookId).not.toBe('');
	});

	test('taking a covered action records a delivery log', async ({ page }) => {
		const webhooksPage = new WebhooksPage(page);
		const tagsPage = new TagsPage(page);
		state.tagName = `E2E Webhook Trigger ${Date.now()}`;

		await loginAsOwner(page, PROJECT);

		// Precondition: a brand-new webhook has not delivered anything yet.
		await webhooksPage.goto();
		await webhooksPage.openLogsById(state.webhookId);
		await expect(webhooksPage.logsRoot).toBeVisible({ timeout: 15_000 });
		await expect(webhooksPage.logsEmptyState).toBeVisible({ timeout: 15_000 });

		// Take an action covered by the webhook (eventTypes: ['all']) → fires `tag.created`.
		await tagsPage.goto();
		await tagsPage.createTag(state.tagName);
		await expect(tagsPage.tagRowByName(state.tagName)).toBeVisible({ timeout: 15_000 });

		// The delivery is processed by the background queue and synced back via Zero,
		// so poll the logs page until the `tag.created` delivery row appears.
		await webhooksPage.gotoLogs(state.webhookId);
		const deliveryRow = webhooksPage.logRowByEventType('tag.created').first();
		await expect(deliveryRow).toBeVisible({ timeout: 45_000 });

		// The delivery attempt should have recorded a terminal status.
		await expect(deliveryRow.getByTestId('settings-webhook-logs-status')).toHaveText(
			/success|failed/,
			{ timeout: 15_000 }
		);
	});

	test('owner can delete the delivery webhook', async ({ page }) => {
		const webhooksPage = new WebhooksPage(page);

		await loginAsOwner(page, PROJECT);
		await webhooksPage.goto();

		await webhooksPage.deleteWebhookById(state.webhookId);
		await expect(webhooksPage.webhookRowById(state.webhookId)).toHaveCount(0, {
			timeout: 15_000
		});
	});
});
