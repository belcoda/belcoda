import { expect, type Dialog, type Locator, type Page } from '@playwright/test';

export class EventEditPage {
	readonly page: Page;
	readonly form: Locator;
	readonly titleInput: Locator;
	readonly slugPreview: Locator;
	readonly saveButton: Locator;
	readonly createdModal: Locator;
	readonly archiveButton: Locator;
	readonly deleteButton: Locator;

	constructor(page: Page) {
		this.page = page;
		this.form = page.getByTestId('event-form');
		this.titleInput = page.getByTestId('event-title-input');
		this.slugPreview = page.getByTestId('event-slug-preview');
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
	}

	async submit() {
		await this.saveButton.click();
	}

	async waitForModal() {
		await this.createdModal.waitFor({ state: 'visible', timeout: 15_000 });
	}

	async closeModal() {
		await this.page.keyboard.press('Escape');
		await this.createdModal.waitFor({ state: 'hidden', timeout: 10_000 });
	}

	private async withDialogAccepted(page: Page, action: () => Promise<void>) {
		const acceptDialog = (dialog: Dialog) => void dialog.accept();
		page.on('dialog', acceptDialog);
		try {
			await action();
		} finally {
			page.off('dialog', acceptDialog);
		}
	}

	async archiveEvent(page: Page) {
		await this.withDialogAccepted(page, async () => {
			await this.archiveButton.scrollIntoViewIfNeeded();
			await this.archiveButton.click();
			await expect(page).toHaveURL('/events', { timeout: 30_000 });
		});
	}

	async deleteEvent(page: Page) {
		await this.withDialogAccepted(page, async () => {
			await this.deleteButton.scrollIntoViewIfNeeded();
			await this.deleteButton.click();
			await expect(page).toHaveURL('/events', { timeout: 30_000 });
		});
	}
}
