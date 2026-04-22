import type { Locator, Page } from '@playwright/test';

export class WebhooksPage {
	readonly page: Page;

	constructor(page: Page) {
		this.page = page;
	}

	async goto() {
		await this.page.goto('/settings/webhooks');
	}

	get root(): Locator {
		return this.page.getByTestId('settings-webhooks');
	}

	get createWebhookTrigger(): Locator {
		return this.page.getByTestId('settings-webhooks-create').first();
	}

	get webhookNameInput(): Locator {
		return this.page.getByTestId('settings-webhooks-name-input');
	}

	get webhookTargetUrlInput(): Locator {
		return this.page.getByTestId('settings-webhooks-url-input');
	}

	get createSubmitButton(): Locator {
		return this.page.getByTestId('settings-webhooks-submit');
	}

	webhookRow(name: string, targetUrl: string): Locator {
		return this.page
			.getByTestId('settings-webhooks-row')
			.filter({ has: this.page.getByRole('cell', { name }) })
			.filter({
				has: this.page.getByTestId('settings-webhooks-target-link').filter({ hasText: targetUrl })
			});
	}

	async createWebhook(name: string, targetUrl: string) {
		await this.createWebhookTrigger.click();
		await this.webhookNameInput.fill(name);
		await this.webhookTargetUrlInput.fill(targetUrl);
		await this.createSubmitButton.click();
	}

	async deleteWebhook(name: string, targetUrl: string) {
		const row = this.webhookRow(name, targetUrl);
		await row.getByTestId('settings-webhooks-delete').click();
	}
}
