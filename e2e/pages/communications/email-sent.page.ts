import type { Locator, Page } from '@playwright/test';

export class EmailSentPage {
	readonly page: Page;
	readonly listRoot: Locator;
	readonly searchInput: Locator;
	readonly detailRoot: Locator;
	readonly detailSubject: Locator;
	readonly detailMessage: Locator;

	constructor(page: Page) {
		this.page = page;
		this.listRoot = page.getByTestId('email-list');
		this.searchInput = page.getByTestId('email-list-search');
		this.detailRoot = page.getByTestId('email-sent-detail');
		this.detailSubject = page.getByTestId('email-sent-detail-subject');
		this.detailMessage = page.getByTestId('email-sent-detail-message');
	}

	listItemBySubject(subject: string): Locator {
		return this.page.getByTestId('email-list-item').filter({ hasText: subject });
	}

	async gotoSentFolder() {
		await this.page.goto('/communications/email/sent');
	}

	async waitForList() {
		await this.listRoot.waitFor({ state: 'visible', timeout: 15_000 });
	}

	async openSentItemBySubject(subject: string) {
		const item = this.listItemBySubject(subject);
		await item.waitFor({ state: 'visible', timeout: 20_000 });
		await item.click();
	}

	async waitForDetail() {
		await this.detailRoot.waitFor({ state: 'visible', timeout: 15_000 });
	}
}
