import type { Locator, Page } from '@playwright/test';

export class PetitionEditPage {
	readonly page: Page;
	readonly form: Locator;
	readonly titleInput: Locator;
	readonly saveButton: Locator;
	readonly dangerZone: Locator;
	readonly archiveButton: Locator;
	readonly deleteButton: Locator;

	constructor(page: Page) {
		this.page = page;
		this.form = page.getByTestId('petition-form');
		this.titleInput = page.getByTestId('petition-title-input');
		this.saveButton = page.getByTestId('petition-save-button');
		this.dangerZone = page.getByTestId('petition-danger-zone');
		this.archiveButton = page.getByTestId('petition-archive-button');
		this.deleteButton = page.getByTestId('petition-delete-button');
	}

	async waitForForm() {
		await this.form.waitFor({ state: 'visible', timeout: 15_000 });
	}

	async clearAndFillTitle(title: string) {
		await this.titleInput.fill(title);
		await this.page.waitForTimeout(400);
	}

	async submit() {
		await this.saveButton.click();
	}

	private async ensureDangerZoneExpanded(actionButton: Locator) {
		await this.dangerZone.scrollIntoViewIfNeeded();
		const isVisible = await actionButton.isVisible().catch(() => false);
		if (!isVisible) {
			await this.dangerZone.getByText('Danger zone').click();
			await actionButton.waitFor({ state: 'visible', timeout: 10_000 });
		}
	}

	async archivePetition() {
		await this.ensureDangerZoneExpanded(this.archiveButton);
		await this.archiveButton.click();
		await this.page.getByRole('button', { name: 'Archive' }).click();
		await this.page.waitForURL('/petitions', { timeout: 15_000 });
	}

	async deletePetition() {
		await this.ensureDangerZoneExpanded(this.deleteButton);
		await this.deleteButton.click();
		await this.page.getByRole('button', { name: 'Delete' }).click();
		await this.page.waitForURL('/petitions', { timeout: 15_000 });
	}
}
