import type { Locator, Page } from '@playwright/test';

export class PetitionSignaturesPage {
	readonly page: Page;
	readonly summaryTable: Locator;
	readonly detailedTable: Locator;
	readonly downloadCsvButton: Locator;
	readonly addSignatureButton: Locator;
	readonly viewAllButton: Locator;

	constructor(page: Page) {
		this.page = page;
		this.summaryTable = page.getByTestId('petition-signature-table');
		this.detailedTable = page.getByTestId('petition-signatures-detailed-table');
		this.downloadCsvButton = page.getByTestId('petition-signatures-download-csv');
		this.addSignatureButton = page.getByTestId('petition-signatures-add-signature');
		this.viewAllButton = page.getByTestId('petition-signatures-view-all');
	}
}
