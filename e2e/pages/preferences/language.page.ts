import { expect, type Locator, type Page } from '@playwright/test';

const LOCALES = ['en', 'es', 'pt'] as const;

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

	async getLocaleCookie(): Promise<string | undefined> {
		const cookies = await this.page.context().cookies();
		return cookies.find((cookie) => cookie.name === 'BELCODA_LOCALE')?.value;
	}

	async selectLanguage(locale: string) {
		const label = localeLabel(locale);
		const currentCookie = await this.getLocaleCookie();
		const triggerText = ((await this.selectTrigger.textContent()) ?? '').trim();
		const uiShowsTarget = triggerText.includes(label);

		if (currentCookie === locale && uiShowsTarget) {
			return;
		}

		if (uiShowsTarget) {
			const alternate = LOCALES.find((candidate) => candidate !== locale)!;
			await this.pickLocaleOption(alternate);
		}

		if (currentCookie !== locale || uiShowsTarget) {
			await this.pickLocaleOption(locale);
		}
	}

	private async pickLocaleOption(locale: string) {
		await this.selectTrigger.click();
		await this.option(locale).click();
		await expect(this.selectTrigger).toContainText(localeLabel(locale), { timeout: 10_000 });
		await expect.poll(async () => this.getLocaleCookie(), { timeout: 15_000 }).toBe(locale);
	}

	async currentLanguage(): Promise<string> {
		return (await this.selectTrigger.textContent()) ?? '';
	}
}
