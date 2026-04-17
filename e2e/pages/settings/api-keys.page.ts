import type { Locator, Page } from '@playwright/test';

export class ApiKeysPage {
	readonly page: Page;

	constructor(page: Page) {
		this.page = page;
	}

	async goto() {
		await this.page.goto('/settings/api-keys');
	}

	get newApiKeyTrigger(): Locator {
		return this.page.getByRole('button', { name: /new/i });
	}

	get keyNameInput(): Locator {
		return this.page.locator('#key-name');
	}

	get createButton(): Locator {
		return this.page.getByRole('button', { name: 'Create' });
	}

	get closeCreateModalButton(): Locator {
		return this.page.getByRole('button', { name: 'Close' });
	}

	apiKeyRow(name: string): Locator {
		return this.page.locator('tr').filter({ has: this.page.getByRole('cell', { name }) });
	}

	get deleteConfirmButton(): Locator {
		return this.page.getByRole('button', { name: 'Delete' });
	}

	async createApiKey(name: string) {
		await this.newApiKeyTrigger.click();
		await this.keyNameInput.fill(name);
		await this.createButton.click();
	}

	async deleteApiKey(name: string) {
		const row = this.apiKeyRow(name);
		await row.getByRole('button', { name: 'Delete API key' }).click();
		await this.deleteConfirmButton.click();
	}
}
