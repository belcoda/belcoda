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
	readonly recipientsPicker: Locator;
	readonly recipientOptions: Locator;
	readonly addNodeTrigger: Locator;
	readonly addMessageNodeOption: Locator;
	readonly messageTextareas: Locator;
	readonly sourceHandles: Locator;
	readonly targetHandles: Locator;

	constructor(page: Page) {
		this.page = page;
		this.saveButton = page.getByTestId('flow-save-button');
		this.sendButton = page.getByTestId('flow-send-button');
		this.discardButton = page.getByTestId('flow-discard-button');
		this.testButton = page.getByTestId('flow-test-button');
		this.recipientsPicker = page.getByTestId('communications-recipients-multiselect');
		this.recipientOptions = page.getByTestId('communications-recipient-option');
		this.addNodeTrigger = page.getByTestId('flow-add-node-trigger');
		this.addMessageNodeOption = page.getByTestId('flow-add-node-message');
		this.messageTextareas = page.getByTestId('flow-message-textarea');
		this.sourceHandles = page.getByTestId('flow-handle-source');
		this.targetHandles = page.getByTestId('flow-handle-target');
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

	async selectEveryoneRecipient() {
		const recipientsInput = this.recipientsPicker.getByPlaceholder('Recipients').first();
		await recipientsInput.click();

		const everyoneOption = this.recipientOptions.filter({ hasText: /Everyone/i }).first();
		await everyoneOption.waitFor({ state: 'visible', timeout: 10_000 });
		await everyoneOption.click();
	}

	async addSimpleMessageNode() {
		await this.addNodeTrigger.click();
		await this.addMessageNodeOption.click();
	}

	async editLatestMessageText(text: string) {
		const textarea = this.messageTextareas.last();
		await textarea.waitFor({ state: 'visible', timeout: 10_000 });
		await textarea.fill(text);
	}

	async connectLatestNodeToPreviousByDrag() {
		const sourceCount = await this.sourceHandles.count();
		const targetCount = await this.targetHandles.count();
		if (sourceCount < 2 || targetCount < 2) {
			throw new Error('Not enough flow handles to connect nodes');
		}

		const sourceHandle = this.sourceHandles.nth(sourceCount - 2);
		const targetHandle = this.targetHandles.nth(targetCount - 1);
		await sourceHandle.waitFor({ state: 'visible', timeout: 10_000 });
		await targetHandle.waitFor({ state: 'visible', timeout: 10_000 });

		const sourceBox = await sourceHandle.boundingBox();
		const targetBox = await targetHandle.boundingBox();
		if (!sourceBox || !targetBox) {
			throw new Error('Could not resolve handle coordinates for drag connection');
		}

		await this.page.mouse.move(
			sourceBox.x + sourceBox.width / 2,
			sourceBox.y + sourceBox.height / 2
		);
		await this.page.mouse.down();
		await this.page.mouse.move(
			targetBox.x + targetBox.width / 2,
			targetBox.y + targetBox.height / 2,
			{
				steps: 12
			}
		);
		await this.page.mouse.up();
	}
}
