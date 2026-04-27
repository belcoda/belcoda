import type { Page, Locator } from '@playwright/test';

export class WhatsAppTemplatesListPage {
	readonly page: Page;

	constructor(page: Page) {
		this.page = page;
	}

	async goto() {
		await this.page.goto('/settings/whatsapp/templates');
		await this.page.getByTestId('whatsapp-templates-heading').waitFor({
			state: 'visible',
			timeout: 15_000
		});
	}

	createTemplateLink(): Locator {
		return this.page.getByTestId('whatsapp-templates-create').first();
	}

	rowForTemplateId(templateId: string): Locator {
		return this.page.locator(
			`[data-testid="whatsapp-template-row"][data-template-id="${templateId}"]`
		);
	}

	rowForTemplateName(name: string): Locator {
		return this.page.locator(`[data-testid="whatsapp-template-row"][data-template-name="${name}"]`);
	}

	editLinkForRow(row: Locator): Locator {
		return row.getByTestId('whatsapp-template-edit');
	}

	submitButtonForRow(row: Locator): Locator {
		return row.getByTestId('whatsapp-template-submit');
	}

	statusCellForRow(row: Locator): Locator {
		return row.getByTestId('whatsapp-template-row-status');
	}

	editLinkForTemplateId(templateId: string): Locator {
		return this.page.locator(
			`[data-testid="whatsapp-template-edit"][data-template-id="${templateId}"]`
		);
	}

	submitButtonForTemplateId(templateId: string): Locator {
		return this.page.locator(
			`[data-testid="whatsapp-template-submit"][data-template-id="${templateId}"]`
		);
	}
}

export class WhatsAppTemplateFormPage {
	readonly page: Page;

	constructor(page: Page) {
		this.page = page;
	}

	async gotoNew() {
		await this.page.goto('/settings/whatsapp/templates/new');
		await this.page.getByTestId('whatsapp-template-new-heading').waitFor({
			state: 'visible',
			timeout: 15_000
		});
		await this.page.getByTestId('whatsapp-template-form').waitFor({
			state: 'visible',
			timeout: 15_000
		});
	}

	async gotoEdit(templateId: string) {
		await this.page.goto(`/settings/whatsapp/templates/${templateId}`);
		await this.page.getByTestId('whatsapp-template-edit-heading').waitFor({
			state: 'visible',
			timeout: 15_000
		});
		await this.page.getByTestId('whatsapp-template-form').waitFor({
			state: 'visible',
			timeout: 15_000
		});
	}

	templateNameInput(): Locator {
		return this.page.getByTestId('whatsapp-template-name-input');
	}

	bodyTextarea(): Locator {
		return this.page.getByTestId('whatsapp-template-body-text');
	}

	saveCreateButton(): Locator {
		return this.page.getByTestId('whatsapp-template-create-submit');
	}

	saveEditButton(): Locator {
		return this.page.getByTestId('whatsapp-template-save');
	}

	async fillTemplateName(name: string) {
		const input = this.templateNameInput();
		await input.waitFor({ state: 'visible', timeout: 10_000 });
		await input.fill(name);
		await this.page.waitForTimeout(400);
	}

	async fillBodyText(text: string) {
		const ta = this.bodyTextarea();
		await ta.waitFor({ state: 'visible', timeout: 10_000 });
		await ta.fill(text);
	}

	async fillFirstExampleVariable(value: string) {
		const exampleInput = this.page.locator(
			'[data-testid="whatsapp-template-example-input"][data-example-index="0"]'
		);
		await exampleInput.waitFor({ state: 'visible', timeout: 10_000 });
		await exampleInput.fill(value);
	}

	async saveCreate() {
		await this.saveCreateButton().click();
		await this.page.waitForURL(/\/settings\/whatsapp\/templates\/?$/, { timeout: 15_000 });
	}

	async saveEdit() {
		await this.saveEditButton().click();
		await this.page.waitForURL(/\/settings\/whatsapp\/templates\/?$/, { timeout: 15_000 });
	}
}
