import type { Locator, Page } from '@playwright/test';

export class PetitionDetailPage {
	readonly page: Page;
	readonly actionDropdownTrigger: Locator;
	readonly signaturesTable: Locator;
	readonly titleDisplay: Locator;

	constructor(page: Page) {
		this.page = page;
		this.actionDropdownTrigger = page.getByTestId('petition-action-dropdown');
		this.signaturesTable = page.getByTestId('petition-signature-table');
		this.titleDisplay = page.getByTestId('petition-title-display');
	}

	async goto(petitionId: string) {
		await this.page.goto(`/petitions/${petitionId}`);
	}

	async waitForLoaded() {
		await this.actionDropdownTrigger.waitFor({ state: 'visible', timeout: 15_000 });
	}

	async openActionDropdown() {
		await this.actionDropdownTrigger.click();
		await this.page.waitForSelector('[role="menu"]', { timeout: 5_000 });
	}

	async clickEditPetition() {
		await this.page.getByTestId('petition-action-edit').click();
	}

	async clickPreviewPetition() {
		await this.page.getByTestId('petition-action-preview').click();
	}

	async clickDetailedSignatures() {
		await this.page.getByTestId('petition-action-signatures').click();
	}
}
