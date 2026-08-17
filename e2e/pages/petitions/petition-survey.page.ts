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
		const triggers = this.page.locator('[data-testid^="survey-question-trigger-"]');
		const labelInputs = this.page.locator('[data-testid^="survey-custom-question-label-"]');
		const countBefore = await triggers.count();

		await expect(this.addQuestionTrigger).toBeVisible({ timeout: 15_000 });
		await this.addQuestionTrigger.scrollIntoViewIfNeeded();

		let added = false;
		for (let attempt = 0; attempt < 3; attempt += 1) {
			await this.addQuestionTrigger.click();
			const shortTextOption = this.page
				.getByTestId('survey-add-short-text')
				.or(this.page.getByRole('menuitem', { name: 'Short text' }));
			await shortTextOption.waitFor({ state: 'visible', timeout: 5_000 });
			await shortTextOption.click();

			try {
				await expect(triggers).toHaveCount(countBefore + 1, { timeout: 5_000 });
				added = true;
				break;
			} catch {
				await this.page.keyboard.press('Escape');
			}
		}

		if (!added) {
			throw new Error('Failed to add short text survey question after 3 attempts');
		}

		const newTrigger = triggers.nth(countBefore);
		const labelInput = labelInputs.last();
		if (!(await labelInput.isVisible())) {
			await newTrigger.click();
		}
		await labelInput.waitFor({ state: 'visible', timeout: 15_000 });
		await labelInput.fill(label, { timeout: 15_000 });
		await labelInput.blur();
	}
}
