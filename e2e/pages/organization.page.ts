import type { Page, Locator } from '@playwright/test';

export class OrganizationPage {
	readonly page: Page;

	constructor(page: Page) {
		this.page = page;
	}

	async goto() {
		await this.page.goto('/organization');
	}

	get acceptButton(): Locator {
		return this.page.getByTestId('invitation-accept').first();
	}

	get declineButton(): Locator {
		return this.page.getByTestId('invitation-decline').first();
	}

	async acceptInvitation() {
		await this.acceptButton.waitFor({ state: 'visible', timeout: 30_000 });
		await this.acceptButton.click();
	}

	async declineInvitation() {
		await this.declineButton.waitFor({ state: 'visible', timeout: 30_000 });
		this.page.once('dialog', (dialog) => dialog.accept());
		await this.declineButton.click();
	}
}
