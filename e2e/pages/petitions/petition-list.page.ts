import type { Locator, Page } from '@playwright/test';

export class PetitionListPage {
	readonly page: Page;
	readonly createButton: Locator;

	constructor(page: Page) {
		this.page = page;
		this.createButton = page.getByTestId('petitions-create-button');
	}

	async goto() {
		await this.page.goto('/petitions');
	}

	async clickCreate() {
		await this.createButton.click();
	}
}
