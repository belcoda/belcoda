import type { Locator, Page } from '@playwright/test';

export class SendSignaturesPage {
	readonly page: Page;

	constructor(page: Page) {
		this.page = page;
	}

	async goto() {
		await this.page.goto('/settings/email/send_signatures');
	}

	get newSignatureTrigger(): Locator {
		return this.page.getByTestId('settings-send-signatures-new-button');
	}

	get createSignatureButton(): Locator {
		return this.page.getByTestId('settings-send-signature-create-submit-button');
	}

	get saveChangesButton(): Locator {
		return this.page.getByTestId('settings-send-signature-edit-submit-button');
	}

	get defaultSignatureTrigger(): Locator {
		return this.page.getByTestId('settings-send-signatures-default-select-trigger');
	}

	get systemSignatureCard(): Locator {
		return this.page.getByTestId('settings-send-signatures-system-card');
	}

	signatureRowByEmail(emailAddress: string): Locator {
		return this.page.locator(
			`[data-testid="settings-send-signatures-custom-row"][data-email-address="${emailAddress}"]`
		);
	}

	async createSignature(input: {
		displayName: string;
		emailAddress: string;
		replyTo?: string;
		returnPathDomain?: string;
	}) {
		await this.newSignatureTrigger.click();
		await this.page
			.getByTestId('settings-send-signature-create-name-input')
			.fill(input.displayName);
		await this.page
			.getByTestId('settings-send-signature-create-email-address-input')
			.fill(input.emailAddress);
		if (input.replyTo !== undefined) {
			await this.page
				.getByTestId('settings-send-signature-create-reply-to-input')
				.fill(input.replyTo);
		}
		if (input.returnPathDomain !== undefined) {
			await this.page
				.getByTestId('settings-send-signature-create-return-path-input')
				.fill(input.returnPathDomain);
		}
		await this.createSignatureButton.click();
	}

	async openEditForSignature(emailAddress: string) {
		await this.page
			.locator(
				`[data-testid="settings-send-signatures-row-edit-button"][data-email-address="${emailAddress}"]`
			)
			.click();
	}

	async editSignature(
		emailAddress: string,
		input: { displayName?: string; replyTo?: string; returnPathDomain?: string }
	) {
		await this.openEditForSignature(emailAddress);
		if (input.displayName !== undefined) {
			await this.page
				.getByTestId('settings-send-signature-edit-name-input')
				.fill(input.displayName);
		}
		if (input.replyTo !== undefined) {
			await this.page
				.getByTestId('settings-send-signature-edit-reply-to-input')
				.fill(input.replyTo);
		}
		if (input.returnPathDomain !== undefined) {
			await this.page
				.getByTestId('settings-send-signature-edit-return-path-input')
				.fill(input.returnPathDomain);
		}
		await this.saveChangesButton.click();
	}

	async verifySignature(emailAddress: string) {
		await this.page
			.locator(
				`[data-testid="settings-send-signatures-row-verify-button"][data-email-address="${emailAddress}"]`
			)
			.click();
	}

	async deleteSignature(emailAddress: string) {
		this.page.once('dialog', (dialog) => dialog.accept());
		await this.page
			.locator(
				`[data-testid="settings-send-signatures-row-delete-button"][data-email-address="${emailAddress}"]`
			)
			.click();
	}

	async selectDefaultSignature(optionLabel: string) {
		await this.defaultSignatureTrigger.click();
		await this.page.getByRole('option', { name: optionLabel }).click();
	}
}
