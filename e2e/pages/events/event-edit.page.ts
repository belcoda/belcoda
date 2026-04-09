import type { Page, Locator } from '@playwright/test';

export class EventEditPage {
	readonly page: Page;
	readonly form: Locator;
	readonly titleInput: Locator;
	readonly saveButton: Locator;
	readonly createdModal: Locator;
	readonly archiveButton: Locator;
	readonly deleteButton: Locator;

	constructor(page: Page) {
		this.page = page;
		this.form = page.getByTestId('event-form');
		this.titleInput = page.getByTestId('event-title-input');
		this.saveButton = page.getByTestId('event-save-button');
		this.createdModal = page.getByTestId('event-created-modal');
		this.archiveButton = page.getByTestId('event-archive-button');
		this.deleteButton = page.getByTestId('event-delete-button');
	}

	async waitForForm() {
		await this.form.waitFor({ state: 'visible', timeout: 15_000 });
	}

	async clearAndFillTitle(title: string) {
		await this.titleInput.fill(title);
		await this.page.waitForTimeout(400);
	}

	async submit() {
		await this.saveButton.click();
	}

	async waitForModal() {
		await this.createdModal.waitFor({ state: 'visible', timeout: 15_000 });
	}

	async closeModal() {
		await this.page.keyboard.press('Escape');
	}

	async archiveEvent(page: Page) {
		page.once('dialog', (d) => d.accept());
		await this.archiveButton.click({ delay: 500 });
		await page.waitForURL('/events', { timeout: 10_000 });
	}

	async deleteEvent(page: Page) {
		page.once('dialog', (d) => d.accept());
		await this.deleteButton.click({ delay: 500 });
		await page.waitForURL('/events', { timeout: 10_000 });
	}
}
