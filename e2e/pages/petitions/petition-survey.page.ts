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
		await expect(async () => {
			const labelInput = labelInputs.last();
			if (!(await labelInput.isVisible())) {
				await newTrigger.click();
			}
			await labelInput.waitFor({ state: 'visible', timeout: 2_000 });
			await labelInput.click();
			await labelInput.fill('');
			await labelInput.pressSequentially(label, { delay: 15 });
			await labelInput.blur();
			await expect(labelInput).toHaveValue(label, { timeout: 2_000 });
		}).toPass({ timeout: 15_000 });
	}
}
