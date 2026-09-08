import { expect, type Locator, type Page } from '@playwright/test';

type StandardSurveyField = 'address' | 'gender' | 'dob' | 'workplace' | 'position';

export class PetitionSurveyPage {
	readonly page: Page;
	readonly addQuestionTrigger: Locator;

	constructor(page: Page) {
		this.page = page;
		this.addQuestionTrigger = page.getByTestId('survey-add-question-trigger');
	}

	standardFieldCheckbox(field: StandardSurveyField) {
		return this.page
			.getByTestId(`standard-information-${field}`)
			.or(this.page.locator(`#standard-information-${field}`));
	}

	async checkStandardField(field: StandardSurveyField) {
		const checkbox = this.standardFieldCheckbox(field);
		await checkbox.waitFor({ state: 'visible', timeout: 10_000 });
		await checkbox.scrollIntoViewIfNeeded();

		await expect(async () => {
			const isChecked =
				(await checkbox.getAttribute('aria-checked')) === 'true' ||
				(await checkbox.getAttribute('data-state')) === 'checked' ||
				(await checkbox.isChecked().catch(() => false));
			if (!isChecked) {
				const label = this.page.locator(`label[for="standard-information-${field}"]`);
				if (await label.isVisible().catch(() => false)) {
					await label.click();
				} else {
					await checkbox.click();
				}
			}
			await this.expectStandardFieldChecked(field, { timeout: 1_000 });
		}).toPass({ timeout: 10_000 });
	}

	async expectStandardFieldChecked(field: StandardSurveyField, options?: { timeout?: number }) {
		await expect(this.standardFieldCheckbox(field)).toHaveAttribute(
			'aria-checked',
			'true',
			options
		);
	}

	async addShortTextQuestion(label: string) {
		await expect(this.addQuestionTrigger).toBeVisible({ timeout: 15_000 });
		await this.addQuestionTrigger.scrollIntoViewIfNeeded();

		const triggers = this.page.locator('[data-testid^="survey-question-trigger-"]');
		const initialCount = await triggers.count();

		await this.page.keyboard.press('Escape');
		await this.addQuestionTrigger.click();
		const shortTextOption = this.page
			.getByTestId('survey-add-short-text')
			.or(this.page.getByRole('menuitem', { name: 'Short text' }));
		await shortTextOption.waitFor({ state: 'visible', timeout: 5_000 });
		await shortTextOption.click();
		await expect(triggers).toHaveCount(initialCount + 1, { timeout: 5_000 });

		await expect(async () => {
			const labelInput = this.page.locator('[data-testid^="survey-custom-question-label-"]').last();
			await expect(labelInput).toBeVisible({ timeout: 5_000 });
			await labelInput.scrollIntoViewIfNeeded();
			await labelInput.fill('');
			await labelInput.pressSequentially(label, { delay: 15 });
			await labelInput.blur();
			await expect(labelInput).toHaveValue(label, { timeout: 2_000 });
		}).toPass({ timeout: 30_000 });
	}
}
