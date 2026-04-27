import type { Locator, Page } from '@playwright/test';

export class EmailNavigationPage {
	readonly page: Page;
	readonly composeTrigger: Locator;
	readonly composeEmailLink: Locator;
	readonly draftsLink: Locator;
	readonly sentLink: Locator;

	constructor(page: Page) {
		this.page = page;
		this.composeTrigger = page.getByTestId('communications-compose-trigger');
		this.composeEmailLink = page.getByTestId('communications-compose-email-link');
		this.draftsLink = page.getByTestId('communications-email-drafts-link');
		this.sentLink = page.getByTestId('communications-email-sent-link');
	}

	async gotoDrafts() {
		await this.page.goto('/communications/email/drafts');
	}

	async gotoSent() {
		await this.page.goto('/communications/email/sent');
	}

	async openComposeMenu() {
		await this.composeTrigger.click();
	}

	async clickComposeEmail() {
		await this.openComposeMenu();
		await this.composeEmailLink.click();
	}
}
