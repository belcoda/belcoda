import type { Locator, Page } from '@playwright/test';

export class WhatsAppNavigationPage {
	readonly page: Page;
	readonly composeTrigger: Locator;
	readonly composeWhatsAppLink: Locator;
	readonly draftsLink: Locator;
	readonly sentLink: Locator;

	constructor(page: Page) {
		this.page = page;
		this.composeTrigger = page.getByTestId('communications-compose-trigger');
		this.composeWhatsAppLink = page.getByTestId('communications-compose-whatsapp-link');
		this.draftsLink = page.getByTestId('communications-whatsapp-drafts-link');
		this.sentLink = page.getByTestId('communications-whatsapp-sent-link');
	}

	async gotoDrafts() {
		await this.page.goto('/communications/whatsapp/drafts');
	}

	async gotoSent() {
		await this.page.goto('/communications/whatsapp/sent');
	}

	async openComposeMenu() {
		await this.composeTrigger.click();
	}

	async clickComposeWhatsApp() {
		await this.openComposeMenu();
		await this.composeWhatsAppLink.click();
	}
}

export class WhatsAppListPage {
	readonly page: Page;
	readonly searchInput: Locator;
	readonly threadRows: Locator;

	constructor(page: Page) {
		this.page = page;
		this.searchInput = page.getByTestId('communications-whatsapp-search-input');
		this.threadRows = page.getByTestId('communications-whatsapp-thread-row');
	}

	threadRowById(threadId: string): Locator {
		return this.page.locator(
			`[data-testid="communications-whatsapp-thread-row"][data-thread-id="${threadId}"]`
		);
	}

	async waitForListVisible() {
		await this.searchInput.waitFor({ state: 'visible', timeout: 15_000 });
	}

	async openThreadById(threadId: string) {
		const row = this.threadRowById(threadId);
		await row.waitFor({ state: 'visible', timeout: 20_000 });
		await row.click();
	}
}

export class WhatsAppDraftPage {
	readonly page: Page;
	readonly saveButton: Locator;
	readonly sendButton: Locator;
	readonly discardButton: Locator;
	readonly testButton: Locator;

	constructor(page: Page) {
		this.page = page;
		this.saveButton = page.getByTestId('flow-save-button');
		this.sendButton = page.getByTestId('flow-send-button');
		this.discardButton = page.getByTestId('flow-discard-button');
		this.testButton = page.getByTestId('flow-test-button');
	}

	async gotoDraftById(threadId: string) {
		await this.page.goto(`/communications/whatsapp/drafts/${threadId}`);
	}

	async waitForLoaded() {
		await this.saveButton.waitFor({ state: 'visible', timeout: 20_000 });
		await this.sendButton.waitFor({ state: 'visible', timeout: 20_000 });
	}

	async save() {
		await this.saveButton.click();
	}

	async sendAndConfirm() {
		this.page.once('dialog', (dialog) => dialog.accept());
		await this.sendButton.click();
	}
}
