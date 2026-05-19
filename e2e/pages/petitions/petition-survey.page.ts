import { expect, type Locator, type Page } from '@playwright/test';

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
		const menuItem = this.page.getByRole('menuitem', { name: 'Short text' });
		const labelInput = this.page.locator('[data-testid^="survey-custom-question-label-"]').last();

		await this.addQuestionTrigger.scrollIntoViewIfNeeded();

		await expect(async () => {
			await this.page.keyboard.press('Escape');
			await this.addQuestionTrigger.click();
			await menuItem.waitFor({ state: 'visible', timeout: 3_000 });
			await menuItem.click();
			await expect(labelInput).toBeVisible({ timeout: 3_000 });
		}).toPass({ timeout: 20_000 });

		await labelInput.fill(label);
	}
}
