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
		return this.page.getByRole('button', { name: 'New' });
	}

	get createSignatureButton(): Locator {
		return this.page.getByRole('button', { name: 'Create signature' });
	}

	get saveChangesButton(): Locator {
		return this.page.getByRole('button', { name: 'Save changes' });
	}

	get defaultSignatureTrigger(): Locator {
		return this.page.locator('button[data-select-trigger]').first();
	}

	get systemSignatureCard(): Locator {
		return this.page.getByRole('heading', { name: 'System send signature' });
	}

	signatureRowByEmail(emailAddress: string): Locator {
		return this.page.getByRole('row').filter({ hasText: emailAddress });
	}

	async createSignature(input: {
		displayName: string;
		emailAddress: string;
		replyTo?: string;
		returnPathDomain?: string;
	}) {
		await this.newSignatureTrigger.click();
		await this.page.getByLabel('Display name').fill(input.displayName);
		await this.page.getByLabel('Email address').fill(input.emailAddress);
		if (input.replyTo !== undefined) {
			await this.page.getByLabel('Reply-to address').fill(input.replyTo);
		}
		if (input.returnPathDomain !== undefined) {
			await this.page.getByLabel('Return path domain').fill(input.returnPathDomain);
		}
		await this.createSignatureButton.click();
	}

	async openEditForSignature(emailAddress: string) {
		const row = this.signatureRowByEmail(emailAddress);
		await row.getByRole('button').first().click();
	}

	async editSignature(
		emailAddress: string,
		input: { displayName?: string; replyTo?: string; returnPathDomain?: string }
	) {
		await this.openEditForSignature(emailAddress);
		if (input.displayName !== undefined) {
			await this.page.getByLabel('Display name').fill(input.displayName);
		}
		if (input.replyTo !== undefined) {
			await this.page.getByLabel('Reply-to address').fill(input.replyTo);
		}
		if (input.returnPathDomain !== undefined) {
			await this.page.getByLabel('Return path domain').fill(input.returnPathDomain);
		}
		await this.saveChangesButton.click();
	}

	async verifySignature(emailAddress: string) {
		const row = this.signatureRowByEmail(emailAddress);
		await row.getByRole('button').nth(1).click();
	}

	async deleteSignature(emailAddress: string) {
		this.page.once('dialog', (dialog) => dialog.accept());
		const row = this.signatureRowByEmail(emailAddress);
		await row.getByRole('button').nth(2).click();
	}

	async selectDefaultSignature(optionLabel: string) {
		await this.defaultSignatureTrigger.click();
		await this.page.getByRole('option', { name: optionLabel }).click();
	}
}
