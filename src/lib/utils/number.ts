import type { Locale } from '$lib/utils/language';

export function formatNumber(
	value: number,
	locale: Locale | string = 'en',
	options?: Intl.NumberFormatOptions
): string {
	return new Intl.NumberFormat(locale, options).format(value);
}
