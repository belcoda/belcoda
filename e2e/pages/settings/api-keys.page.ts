import type { Locator, Page } from '@playwright/test';

export class ApiKeysPage {
	readonly page: Page;

	constructor(page: Page) {
		this.page = page;
	}

	async goto() {
		await this.page.goto('/settings/api-keys');
	}

	get root(): Locator {
		return this.page.getByTestId('settings-api-keys');
	}

	get newApiKeyTrigger(): Locator {
		return this.page.getByTestId('settings-api-keys-new');
	}

	get keyNameInput(): Locator {
		return this.page.getByTestId('settings-api-keys-name-input');
	}

	get createButton(): Locator {
		return this.page.getByTestId('settings-api-keys-create');
	}

	get closeCreateModalButton(): Locator {
		return this.page.getByTestId('settings-api-keys-created-close');
	}

	get keyDisplay(): Locator {
		return this.page.getByTestId('settings-api-keys-display');
	}

	apiKeyRow(name: string): Locator {
		return this.page
			.getByTestId('settings-api-keys-row')
			.filter({ has: this.page.getByRole('cell', { name }) });
	}

	get deleteConfirmButton(): Locator {
		return this.page.getByTestId('settings-api-keys-delete-confirm');
	}

	async createApiKey(name: string) {
		await this.newApiKeyTrigger.click();
		await this.keyNameInput.fill(name);
		await this.createButton.click();
	}

	async deleteApiKey(name: string) {
		const row = this.apiKeyRow(name);
		await row.getByTestId('settings-api-keys-delete').click();
		await this.deleteConfirmButton.click();
	}
}
