import type { Page, Locator } from '@playwright/test';

export class PersonProfilePage {
	readonly page: Page;
	readonly deleteButton: Locator;
	readonly loadedContainer: Locator;
	readonly nameDisplay: Locator;
	readonly nameEditButton: Locator;
	readonly givenNameInput: Locator;
	readonly familyNameInput: Locator;
	readonly nameSaveButton: Locator;
	readonly emailEditButton: Locator;
	readonly emailInput: Locator;
	readonly emailSaveButton: Locator;

	constructor(page: Page) {
		this.page = page;
		this.deleteButton = page.getByTestId('person-profile-delete');
		this.loadedContainer = page.getByTestId('person-profile-loaded');
		this.nameDisplay = page.getByTestId('person-profile-name-display');
		this.nameEditButton = page.getByTestId('person-profile-name-edit-btn');
		this.givenNameInput = page.getByTestId('person-profile-given-name');
		this.familyNameInput = page.getByTestId('person-profile-family-name');
		this.nameSaveButton = page.getByTestId('person-profile-name-save');
		this.emailEditButton = page.getByTestId('person-profile-email-edit-btn');
		this.emailInput = page.getByTestId('person-profile-email-input');
		this.emailSaveButton = page.getByTestId('person-profile-email-save');
	}

	async goto(personPath: string) {
		const path = personPath.endsWith('/profile') ? personPath : `${personPath}/profile`;
		await this.page.goto(path);
	}

	async waitForLoaded() {
		await this.loadedContainer.waitFor({ state: 'visible', timeout: 15_000 });
	}

	async editName(givenName: string, familyName: string) {
		await this.nameEditButton.click();
		await this.givenNameInput.fill(givenName);
		await this.familyNameInput.fill(familyName);
		await this.nameSaveButton.click();
	}

	async editEmail(email: string) {
		await this.emailEditButton.click();
		await this.emailInput.fill(email);
		await this.emailSaveButton.click();
	}

	async deletePersonWithConfirm() {
		this.page.once('dialog', (d) => d.accept());
		await this.deleteButton.click({ delay: 1700 });
		await this.page.waitForURL(/\/community\/?$/);
	}
}
