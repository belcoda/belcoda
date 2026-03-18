/**
 * Time input utilities for the accessible hybrid time picker.
 * Handles 24-hour logic internally while displaying 12-hour formats.
 */

export type TimeLimit = { hour: number; minute: number };

/**
 * Convert 24-hour { hour, minute } to a localized 12-hour string (e.g. "2:15 PM").
 */
export function formatTime24to12(hour: number, minute: number): string {
	const h = hour % 12 || 12;
	const m = minute.toString().padStart(2, '0');
	const period = hour < 12 ? 'AM' : 'PM';
	return `${h}:${m} ${period}`;
}

/**
 * Validation: returns true if (h, m) is strictly before limit.
 */
export function isInvalid(h: number, m: number, limit: TimeLimit | null | undefined): boolean {
	if (!limit) return false;
	return h < limit.hour || (h === limit.hour && m < limit.minute);
}

/**
 * Parse "forgiving" manual text entry into { hour, minute } (24-hour).
 * Returns null if unparseable.
 *
 * Supported formats:
 * - HH:MM AM/PM (e.g. "10:30 PM")
 * - HHMM (e.g. "1030" -> 10:30)
 * - H am/pm (e.g. "2pm" -> 14:00)
 * - H (e.g. "9" -> 09:00)
 */
export function parseForgivingTime(text: string): { hour: number; minute: number } | null {
	const trimmed = text.trim();
	if (!trimmed) return null;

	// HH:MM AM/PM, HH:MM AM, HH:MM PM, etc.
	const fullMatch = trimmed.match(/^(\d{1,2}):(\d{2})\s*(am|pm|a\.m\.|p\.m\.)?$/i);
	if (fullMatch) {
		let h = parseInt(fullMatch[1], 10);
		const m = Math.min(59, Math.max(0, parseInt(fullMatch[2], 10)));
		const period = (fullMatch[3] || '').toLowerCase();
		if (period.startsWith('p')) {
			if (h !== 12) h += 12;
		} else if (period.startsWith('a') && h === 12) {
			h = 0;
		}
		if (h >= 0 && h <= 23) return { hour: h, minute: m };
	}

	// H am/pm or HH am/pm (e.g. "2pm", "10 am", "8p")
	const shortMatch = trimmed.match(/^(\d{1,2})\s*(am|pm|a\.m\.|p\.m\.|a|p)$/i);
	if (shortMatch) {
		let h = parseInt(shortMatch[1], 10);
		const period = shortMatch[2].toLowerCase();
		if (period.startsWith('p')) {
			if (h !== 12) h += 12;
		} else if (period.startsWith('a') && h === 12) {
			h = 0;
		}
		if (h >= 0 && h <= 23) return { hour: h, minute: 0 };
	}

	// HHMM (e.g. "1030", "930")
	const compactMatch = trimmed.match(/^(\d{3,4})$/);
	if (compactMatch) {
		const n = compactMatch[1];
		const h = n.length === 3 ? parseInt(n.slice(0, 1), 10) : parseInt(n.slice(0, 2), 10);
		const m = n.length === 3 ? parseInt(n.slice(1, 3), 10) : parseInt(n.slice(2, 4), 10);
		if (h >= 0 && h <= 23 && m >= 0 && m <= 59) return { hour: h, minute: m };
	}

	// Bare hour (e.g. "9", "14")
	const hourOnlyMatch = trimmed.match(/^(\d{1,2})$/);
	if (hourOnlyMatch) {
		const h = parseInt(hourOnlyMatch[1], 10);
		if (h >= 0 && h <= 23) return { hour: h, minute: 0 };
	}

	return null;
}

export type TimeOption = { hour: number; minute: number; label: string };

/**
 * Generate time options for the dropdown at the given step (minutes).
 * Filters out options before disallowBefore.
 */
export function generateTimeOptions(
	step: number,
	disallowBefore: TimeLimit | null | undefined
): TimeOption[] {
	const options: TimeOption[] = [];
	for (let h = 0; h < 24; h++) {
		for (let m = 0; m < 60; m += step) {
			if (isInvalid(h, m, disallowBefore)) continue;
			options.push({
				hour: h,
				minute: m,
				label: formatTime24to12(h, m)
			});
		}
	}
	return options;
}

/**
 * Convert hour/minute to HH:mm for native <input type="time">.
 */
export function toNativeTimeValue(hour: number, minute: number): string {
	return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
}

/**
 * Parse native time value "HH:mm" to { hour, minute }.
 */
export function fromNativeTimeValue(value: string): { hour: number; minute: number } | null {
	if (!value) return null;
	const [h, m] = value.split(':').map((x) => parseInt(x, 10));
	if (Number.isNaN(h) || Number.isNaN(m) || h < 0 || h > 23 || m < 0 || m > 59) return null;
	return { hour: h, minute: m };
}
