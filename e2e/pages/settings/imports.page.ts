import type { Page, Locator } from '@playwright/test';

export class ImportsPage {
	readonly page: Page;
	readonly settingsSidebarImportsLink: Locator;
	readonly newImportTrigger: Locator;
	readonly csvFileInput: Locator;
	readonly downloadSampleButton: Locator;
	readonly uploadCancelButton: Locator;
	readonly uploadSubmitButton: Locator;
	readonly emptyState: Locator;
	readonly importsTable: Locator;

	constructor(page: Page) {
		this.page = page;
		this.settingsSidebarImportsLink = page.getByTestId('settings-sidebar-imports');
		this.newImportTrigger = page.getByTestId('imports-new-import-trigger').first();
		this.csvFileInput = page.getByTestId('imports-csv-file-input');
		this.downloadSampleButton = page.getByTestId('imports-download-sample');
		this.uploadCancelButton = page.getByTestId('imports-upload-cancel');
		this.uploadSubmitButton = page.getByTestId('imports-upload-submit');
		this.emptyState = page.getByTestId('imports-empty-state');
		this.importsTable = page.getByTestId('imports-table');
	}

	async goto() {
		await this.page.goto('/settings/people/imports');
	}

	importRow(importId: string): Locator {
		return this.page.locator(`[data-testid="imports-table-row"][data-import-id="${importId}"]`);
	}

	get importRows(): Locator {
		return this.page.locator('[data-testid="imports-table-row"]');
	}

	rowStatus(importId: string): Locator {
		return this.importRow(importId).getByTestId('imports-row-status');
	}

	rowDetails(importId: string): Locator {
		return this.importRow(importId).getByTestId('imports-row-details');
	}

	viewFailuresButton(importId: string): Locator {
		return this.importRow(importId).getByTestId('imports-view-failures');
	}
}
