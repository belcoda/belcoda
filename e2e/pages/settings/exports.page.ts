import type { Page, Locator } from '@playwright/test';

export class ExportsPage {
	readonly page: Page;
	readonly settingsSidebarExportsLink: Locator;
	readonly emptyState: Locator;

	constructor(page: Page) {
		this.page = page;
		this.settingsSidebarExportsLink = page.getByTestId('settings-sidebar-exports');
		this.emptyState = page.getByTestId('exports-empty-state');
	}

	async goto() {
		await this.page.goto('/settings/people/exports');
	}
}
