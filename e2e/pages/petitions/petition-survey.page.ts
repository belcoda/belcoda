import type { Locator, Page } from '@playwright/test';

export class PetitionSurveyPage {
	readonly page: Page;
	readonly addQuestionTrigger: Locator;

	constructor(page: Page) {
		this.page = page;
		this.addQuestionTrigger = page.getByTestId('survey-add-question-trigger');
	}

	standardFieldCheckbox(field: 'address' | 'gender' | 'dob' | 'workplace' | 'position') {
		return this.page.locator(`#standard-information-${field}`);
	}

	async checkStandardField(field: 'address' | 'gender' | 'dob' | 'workplace' | 'position') {
		const checkbox = this.standardFieldCheckbox(field);
		await checkbox.waitFor({ state: 'visible', timeout: 10_000 });
		await checkbox.scrollIntoViewIfNeeded();
		const isChecked = await checkbox.isChecked().catch(async () => {
			return (await checkbox.getAttribute('aria-checked')) === 'true';
		});
		if (!isChecked) {
			await checkbox.click();
		}
	}

	async addShortTextQuestion(label: string) {
		const labelInputs = this.page.locator('[data-testid^="survey-custom-question-label-"]');
		const countBefore = await labelInputs.count();

		await this.addQuestionTrigger.scrollIntoViewIfNeeded();
		await this.addQuestionTrigger.click();
		const shortTextOption = this.page.getByTestId('survey-add-short-text');
		await shortTextOption.waitFor({ state: 'visible', timeout: 10_000 });
		await shortTextOption.click();

		const newLabelInput = labelInputs.nth(countBefore);
		await newLabelInput.waitFor({ state: 'visible', timeout: 15_000 });
		await newLabelInput.fill(label, { timeout: 15_000 });
		await newLabelInput.blur();
	}
}
