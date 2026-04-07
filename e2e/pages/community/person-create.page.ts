import type { Page, Locator } from '@playwright/test';

export class PersonCreatePage {
	readonly page: Page;
	readonly form: Locator;
	readonly givenNameInput: Locator;
	readonly familyNameInput: Locator;
	readonly emailInput: Locator;
	readonly saveButton: Locator;

	constructor(page: Page) {
		this.page = page;
		this.form = page.getByTestId('person-form');
		this.givenNameInput = page.getByTestId('person-given-name');
		this.familyNameInput = page.getByTestId('person-family-name');
		this.emailInput = page.getByTestId('person-email');
		this.saveButton = page.getByTestId('person-form-save');
	}

	async goto() {
		await this.page.goto('/community/person/new');
		await this.form.waitFor({ state: 'visible' });
	}

	async fillRequiredFields(givenName: string, familyName: string, email: string) {
		await this.givenNameInput.fill(givenName);
		await this.familyNameInput.fill(familyName);
		await this.emailInput.fill(email);
	}

	async submit() {
		await this.saveButton.click();
	}
}
