import { type Locale as LocaleType, clampLocale } from '$lib/utils/language';

export function t(strings: TemplateStringsArray, ...values: string[]): string {
	return strings.reduce((acc, str, i) => acc + str + (values[i] || ''), '');
}

class Locale {
	current: LocaleType = $state('en');

	setLocale(newLocale: string) {
		this.current = clampLocale(newLocale);
	}
}

export const locale = new Locale();
