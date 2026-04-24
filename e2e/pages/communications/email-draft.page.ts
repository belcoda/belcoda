import type { Locator, Page } from '@playwright/test';

export class EmailDraftPage {
	readonly page: Page;
	readonly draftPage: Locator;
	readonly form: Locator;
	readonly subjectInput: Locator;
	readonly bodyEditor: Locator;
	readonly recipientsInput: Locator;
	readonly discardButton: Locator;
	readonly saveButton: Locator;
	readonly testEmailToggleButton: Locator;
	readonly sendButton: Locator;
	readonly testEmailForm: Locator;
	readonly testEmailAddressInput: Locator;
	readonly testEmailSendButton: Locator;

	constructor(page: Page) {
		this.page = page;
		this.draftPage = page.getByTestId('email-draft-page');
		this.form = page.getByTestId('email-form');
		this.subjectInput = page.getByTestId('email-form-subject');
		this.bodyEditor = this.form.locator('[contenteditable="true"]').first();
		this.recipientsInput = this.page.getByPlaceholder('Recipients').first();
		this.discardButton = page.getByTestId('email-draft-discard');
		this.saveButton = page.getByTestId('email-draft-save');
		this.testEmailToggleButton = page.getByTestId('email-draft-test-toggle');
		this.sendButton = page.getByTestId('email-draft-send');
		this.testEmailForm = page.getByTestId('email-test-form');
		this.testEmailAddressInput = page.getByTestId('email-test-address');
		this.testEmailSendButton = page.getByTestId('email-test-send');
	}

	async gotoNewDraft() {
		await this.page.goto('/communications/email/drafts/new');
	}

	async gotoDraftById(id: string) {
		await this.page.goto(`/communications/email/drafts/${id}`);
	}

	async waitForLoaded() {
		await this.draftPage.waitFor({ state: 'visible', timeout: 15_000 });
		await this.form.waitFor({ state: 'visible', timeout: 15_000 });
	}

	async fillSubject(subject: string) {
		await this.subjectInput.fill(subject);
	}

	async fillBody(body: string) {
		await this.bodyEditor.click();
		await this.bodyEditor.fill(body);
	}

	async selectEveryoneRecipient() {
		await this.recipientsInput.click();
		await this.recipientsInput.fill('Everyone');

		// svelte-multiselect is most reliable with keyboard selection.
		await this.page.keyboard.press('ArrowDown');
		await this.page.keyboard.press('Enter');
		await this.page.keyboard.press('Escape');
	}

	async save() {
		await this.saveButton.click();
	}

	async send() {
		await this.sendButton.click();
	}

	async discardAndConfirm() {
		this.page.once('dialog', (dialog) => dialog.accept());
		await this.discardButton.click();
	}

	async openTestEmailForm() {
		await this.testEmailToggleButton.click();
		await this.testEmailForm.waitFor({ state: 'visible', timeout: 10_000 });
	}

	async sendTestEmail(emailAddress: string) {
		await this.openTestEmailForm();
		await this.testEmailAddressInput.fill(emailAddress);
		await this.testEmailSendButton.click();
	}
}
