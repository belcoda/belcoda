import type { Page, Locator } from '@playwright/test';

export class PersonProfilePage {
	readonly page: Page;
	readonly deleteButton: Locator;
	readonly loadedContainer: Locator;

	constructor(page: Page) {
		this.page = page;
		this.deleteButton = page.getByTestId('person-profile-delete');
		this.loadedContainer = page.getByTestId('person-profile-loaded');
	}

	async goto(personPath: string) {
		const path = personPath.endsWith('/profile') ? personPath : `${personPath}/profile`;
		await this.page.goto(path);
	}

	async waitForLoaded() {
		await this.loadedContainer.waitFor({ state: 'visible', timeout: 15_000 });
	}

	async deletePersonWithConfirm() {
		this.page.once('dialog', (d) => d.accept());
		await this.deleteButton.click({ delay: 1700 });
		await this.page.waitForURL(/\/community\/?$/);
	}
}
