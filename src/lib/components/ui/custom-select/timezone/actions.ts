import type { Locale } from '$lib/utils/language';

export function formatTimezone(tz: string, locale: Locale, date = new Date()) {
	const options = {
		timeZone: tz,
		timeZoneName: 'shortOffset', // or 'longOffset' in some environments
		hour: '2-digit',
		minute: '2-digit'
	} as const;

	const formatter = new Intl.DateTimeFormat(locale, options);
	const parts = formatter.formatToParts(date);

	const offset = parts.find((p) => p.type === 'timeZoneName')?.value || '';
	return `${tz} (${offset})`;
}

export function getTimeZonesWithOffsets(locale: Locale): { value: string; label: string }[] {
	return Intl.supportedValuesOf('timeZone').map((zone) => {
		return { value: zone, label: formatTimezone(zone, locale) };
	});
}
