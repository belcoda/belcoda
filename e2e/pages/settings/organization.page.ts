import type { Locator, Page } from '@playwright/test';

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
}
