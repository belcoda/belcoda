import type { Page, Locator } from '@playwright/test';

export class EventCreatePage {
	readonly page: Page;
	readonly form: Locator;
	readonly titleInput: Locator;
	readonly descriptionInput: Locator;
	readonly saveButton: Locator;
	readonly createdModal: Locator;

	constructor(page: Page) {
		this.page = page;
		this.form = page.getByTestId('event-form');
		this.titleInput = page.getByTestId('event-title-input');
		this.descriptionInput = page.getByTestId('event-description-input');
		this.saveButton = page.getByTestId('event-save-button');
		this.createdModal = page.getByTestId('event-created-modal');
	}

	async goto() {
		await this.page.goto('/events/new');
		await this.form.waitFor({ state: 'visible' });
	}

	async fillTitle(title: string) {
		await this.titleInput.fill(title);
	}

	async fillDescription(description: string) {
		await this.descriptionInput.fill(description);
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
}
