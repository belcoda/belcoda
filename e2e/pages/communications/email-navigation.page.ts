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

export class EmailListPage {
	readonly page: Page;
	readonly searchInput: Locator;
	readonly emailItems: Locator;
	readonly scrollContainer: Locator;

	constructor(page: Page) {
		this.page = page;
		this.searchInput = page.getByTestId('email-list-search');
		this.emailItems = page.getByTestId('email-list-item');
		this.scrollContainer = page.getByTestId('email-list-scroll');
	}

	emailItemsForRun(runId: string): Locator {
		return this.emailItems.filter({ hasText: `E2E pagination email ${runId}` });
	}

	async waitForListVisible() {
		await this.searchInput.waitFor({ state: 'visible', timeout: 15_000 });
	}

	async scrollToBottom() {
		await this.scrollContainer.evaluate((element) => {
			element.scrollTop = element.scrollHeight;
		});
	}
}
