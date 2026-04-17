import type { Locator, Page } from '@playwright/test';

export class WebhooksPage {
	readonly page: Page;

	constructor(page: Page) {
		this.page = page;
	}

	async goto() {
		await this.page.goto('/settings/webhooks');
	}

	get createWebhookTrigger(): Locator {
		return this.page.getByRole('button', { name: 'Create Webhook' }).first();
	}

	get webhookNameInput(): Locator {
		return this.page.locator('#webhook-name-header');
	}

	get webhookTargetUrlInput(): Locator {
		return this.page.locator('#webhook-url-header');
	}

	get createSubmitButton(): Locator {
		return this.page.getByRole('button', { name: 'Create' });
	}

	webhookRow(name: string, targetUrl: string): Locator {
		return this.page
			.locator('tr')
			.filter({ has: this.page.getByRole('cell', { name }) })
			.filter({ has: this.page.getByRole('link', { name: targetUrl }) });
	}

	async createWebhook(name: string, targetUrl: string) {
		await this.createWebhookTrigger.click();
		await this.webhookNameInput.fill(name);
		await this.webhookTargetUrlInput.fill(targetUrl);
		await this.createSubmitButton.click();
	}

	async deleteWebhook(name: string, targetUrl: string) {
		const row = this.webhookRow(name, targetUrl);
		await row.getByRole('button').click();
	}
}
