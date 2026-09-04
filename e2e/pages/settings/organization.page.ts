import { expect, type Locator, type Page } from '@playwright/test';

export class OrgConfigPage {
	readonly page: Page;

	constructor(page: Page) {
		this.page = page;
	}

	async goto() {
		await this.page.goto('/settings/organization/configuration');
	}

	get configCard(): Locator {
		return this.page.getByTestId('org-config-card');
	}

	get saveButton(): Locator {
		return this.page.getByTestId('org-config-save');
	}

	get cancelButton(): Locator {
		return this.page.getByTestId('org-config-cancel');
	}

	async expectLoaded() {
		await expect(async () => {
			await expect(this.configCard).toBeVisible();
		}).toPass({ timeout: 30_000 });
	}
}

export class OrgThemesPage {
	readonly page: Page;

	constructor(page: Page) {
		this.page = page;
	}

	async goto() {
		await this.page.goto('/settings/organization/themes');
	}

	get themesForm(): Locator {
		return this.page.getByTestId('org-themes-form');
	}

	get saveButton(): Locator {
		return this.page.getByTestId('org-themes-save');
	}

	get cancelButton(): Locator {
		return this.page.getByTestId('org-themes-cancel');
	}

	async expectLoaded() {
		await expect(async () => {
			await expect(this.themesForm).toBeVisible();
		}).toPass({ timeout: 30_000 });
	}
}
