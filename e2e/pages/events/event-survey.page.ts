import type { Page, Locator } from '@playwright/test';

export class EventSurveyPage {
	readonly page: Page;

	readonly addQuestionTrigger: Locator;

	constructor(page: Page) {
		this.page = page;
		this.addQuestionTrigger = page.getByTestId('survey-add-question-trigger');
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
		const labelInput = this.page.getByTestId('survey-custom-question-label-0');
		await labelInput.waitFor({ state: 'visible', timeout: 5_000 });
		await labelInput.fill(label);
	}
}
