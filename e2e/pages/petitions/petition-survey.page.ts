import type { Locator, Page } from '@playwright/test';

export class PetitionSurveyPage {
	readonly page: Page;
	readonly addQuestionTrigger: Locator;
	readonly accordionTrigger: Locator;

	constructor(page: Page) {
		this.page = page;
		this.addQuestionTrigger = page.getByTestId('survey-add-question-trigger');
		this.accordionTrigger = page.locator('[data-slot="accordion-trigger"]');
	}

	async checkStandardField(field: 'address' | 'gender' | 'dob' | 'workplace' | 'position') {
		const checkbox = this.page.locator(`#standard-information-${field}`);
		const isChecked = await checkbox.isChecked();
		if (!isChecked) {
			await checkbox.click();
		}
	}

	async addShortTextQuestion(label: string) {
		await this.addQuestionTrigger.click();
		await this.page.getByTestId('survey-add-short-text').click();
		const labelInput = this.page.locator('[data-testid^="survey-custom-question-label-"]').last();
		await labelInput.waitFor({ state: 'attached', timeout: 15_000 });
		const isVisible = await labelInput.isVisible().catch(() => false);
		if (!isVisible) {
			await this.accordionTrigger.last().click();
		}
		await labelInput.waitFor({ state: 'visible', timeout: 15_000 });
		await labelInput.fill(label);
	}
}
