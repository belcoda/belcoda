import type { Locator, Page } from '@playwright/test';

export class PetitionCreatePage {
	readonly page: Page;
	readonly form: Locator;
	readonly titleInput: Locator;
	readonly descriptionInput: Locator;
	readonly targetInput: Locator;
	readonly textInput: Locator;
	readonly slugPreview: Locator;
	readonly saveButton: Locator;
	readonly createdModal: Locator;

	constructor(page: Page) {
		this.page = page;
		this.form = page.getByTestId('petition-form');
		this.titleInput = page.getByTestId('petition-title-input');
		this.descriptionInput = page.getByTestId('petition-description-input');
		this.targetInput = page.getByTestId('petition-target-input');
		this.textInput = page.getByTestId('petition-text-input');
		this.slugPreview = page.getByTestId('petition-slug-preview');
		this.saveButton = page.getByTestId('petition-save-button');
		this.createdModal = page.getByTestId('petition-created-modal');
	}

	async goto() {
		await this.page.goto('/petitions/new');
		await this.form.waitFor({ state: 'visible' });
	}

	async fillTitle(title: string) {
		await this.titleInput.fill(title);
	}

	async fillDescription(description: string) {
		await this.descriptionInput.fill(description);
	}

	async fillTarget(target: string) {
		await this.targetInput.fill(target);
	}

	async fillPetitionText(text: string) {
		await this.textInput.fill(text);
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
}
