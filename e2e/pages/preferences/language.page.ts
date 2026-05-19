import { expect, type Locator, type Page } from '@playwright/test';

function localeLabel(locale: string): string {
	const labels: Record<string, string> = {
		en: 'English',
		es: 'Español',
		pt: 'Português'
	};
	return labels[locale] ?? locale;
}

export class PreferencesLanguagePage {
	readonly page: Page;

	constructor(page: Page) {
		this.page = page;
	}

	async goto() {
		await this.page.goto('/preferences/language');
	}

	get root(): Locator {
		return this.page.getByTestId('preferences-language-page');
	}

	get selectTrigger(): Locator {
		return this.page.getByTestId('preferences-language-select');
	}

	option(locale: string): Locator {
		return this.page.getByTestId(`preferences-language-option-${locale}`);
	}

	async selectLanguage(locale: string) {
		await this.selectTrigger.click();
		await this.option(locale).click();
		await expect(this.selectTrigger).toContainText(localeLabel(locale), { timeout: 10_000 });
	}

	async currentLanguage(): Promise<string> {
		return (await this.selectTrigger.textContent()) ?? '';
	}
}
