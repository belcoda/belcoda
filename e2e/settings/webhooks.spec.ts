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
 * dummy endpoint responds (example.com returns 405 for POST, so it's typically
 * `failed`) — either way a log row is written, which is what proves the webhook
 * fired.
 *
 * The whole flow is a single test wrapped in try/finally: the webhook is subscribed
 * to all events, so a leaked webhook would keep firing for later specs in the same
 * org. The finally block deletes it even if an assertion fails.
 */
test('webhook fires on a covered action and records a delivery log', async ({ page }) => {
	// Delivery is asynchronous (queue pickup + external POST + Zero sync), so give the
	// whole flow a budget well above the poll timeout used for the delivery assertion.
	test.setTimeout(90_000);

	const webhooksPage = new WebhooksPage(page);
	const tagsPage = new TagsPage(page);
	const suffix = Date.now();
	const name = `E2E Delivery Webhook ${suffix}`;
	const targetUrl = `https://example.com/e2e/webhook/delivery/${suffix}`;
	const tagName = `E2E Webhook Trigger ${suffix}`;

	await loginAsOwner(page, PROJECT);

	// Captured inside the try below; kept in scope so `finally` can always clean up.
	let webhookId = '';
	try {
		// Create a webhook to observe deliveries (the UI subscribes it to all events).
		await webhooksPage.goto();
		await webhooksPage.createWebhook(name, targetUrl);
		const row = webhooksPage.webhookRow(name, targetUrl);
		await expect(row).toBeVisible({ timeout: 15_000 });
		webhookId = (await row.getAttribute('data-webhook-id')) ?? '';
		expect(webhookId).not.toBe('');

		// The webhook hasn't delivered anything for this specific tag yet. Matching on
		// the unique tag name keeps this precondition independent of any other activity
		// in the org.
		await webhooksPage.openLogsById(webhookId);
		await expect(webhooksPage.logsRoot).toBeVisible({ timeout: 15_000 });
		await expect(webhooksPage.logRowForEventContaining('tag.created', tagName)).toHaveCount(0);

		// Take an action covered by the webhook → fires `tag.created`.
		await tagsPage.goto();
		await tagsPage.createTag(tagName);
		await expect(tagsPage.tagRowByName(tagName)).toBeVisible({ timeout: 15_000 });

		// The delivery is processed by the background queue and synced back via Zero,
		// so poll the logs page until the delivery row for THIS tag appears. `.first()`
		// guards against a retry inserting a second row for the same tag mid-assertion.
		await webhooksPage.gotoLogs(webhookId);
		const deliveryRow = webhooksPage.logRowForEventContaining('tag.created', tagName).first();
		await expect(deliveryRow).toBeVisible({ timeout: 45_000 });

		// The delivery attempt should have recorded a terminal status.
		await expect(deliveryRow.getByTestId('settings-webhook-logs-status')).toHaveText(
			/success|failed/,
			{ timeout: 15_000 }
		);
	} finally {
		// Best-effort cleanup so a mid-test failure doesn't leak an all-events webhook
		// that keeps firing for later specs in this org. Kept non-throwing so it never
		// masks a real assertion failure from the try block (deletion itself is covered
		// by the "owner can delete a webhook" test above). Falls back to name/target
		// lookup when the id wasn't captured (e.g. creation succeeded but the row
		// assertion failed).
		await webhooksPage.goto().catch(() => {});
		if (webhookId) {
			await webhooksPage.deleteWebhookById(webhookId).catch(() => {});
		} else {
			await webhooksPage.deleteWebhook(name, targetUrl).catch(() => {});
		}
	}
});
