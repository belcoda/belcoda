import type { Locale } from '$lib/utils/language';

export function formatNumber(value: number, locale: Locale | string = 'en'): string {
	return new Intl.NumberFormat(locale).format(value);
}
