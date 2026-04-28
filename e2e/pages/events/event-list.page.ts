import type { Page, Locator } from '@playwright/test';

export class EventListPage {
	readonly page: Page;
	readonly createButton: Locator;

	constructor(page: Page) {
		this.page = page;
		this.createButton = page.getByTestId('events-create-button');
	}

	async goto() {
		await this.page.goto('/events');
	}

	async clickCreate() {
		await this.createButton.click();
	}
}
