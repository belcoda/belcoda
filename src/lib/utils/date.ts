import {
	type DateValue,
	CalendarDate,
	ZonedDateTime,
	toZoned,
	fromDate,
	isSameDay,
	startOfMonth,
	endOfMonth,
	fromAbsolute,
	getLocalTimeZone
} from '@internationalized/date';

export function getTodayCalendarDate(timezone: string): CalendarDate {
	const now = new Date();
	const nowZoned = fromDate(now, timezone);
	return new CalendarDate(nowZoned.year, nowZoned.month, nowZoned.day);
}

export function getWeeksFromTodayCalendarDate(timezone: string, weeks: number): CalendarDate {
	const today = getTodayCalendarDate(timezone);
	return today.add({ weeks });
}

export function getMonthBounds(
	timezone: string,
	date: CalendarDate
): { start: number; end: number } {
	const startDate = toZoned(startOfMonth(date), timezone);
	const endDate = toZoned(endOfMonth(date), timezone);
	const startDayTime = startDate.set({ hour: 0, minute: 0, second: 0, millisecond: 0 });
	const endDayTime = endDate.set({ hour: 23, minute: 59, second: 59, millisecond: 999 });

	return { start: startDayTime.toDate().getTime(), end: endDayTime.toDate().getTime() };
}

export function getMonthBoundFromCalendarDate({
	year,
	month,
	day
}: {
	year: number;
	month: number;
	day: number;
}): {
	start: CalendarDate;
	end: CalendarDate;
} {
	return {
		start: startOfMonth(new CalendarDate(year, month, day)),
		end: endOfMonth(new CalendarDate(year, month, day))
	};
}

export function doesEventStartOnDay(
	{ year, month, day }: { year: number; month: number; day: number },
	startsAt: number,
	eventTimezone: string
) {
	const calendarDate = new CalendarDate(year, month, day);
	const calendarDateZoned = toZoned(calendarDate, eventTimezone);
	const startsAtZoned = fromAbsolute(startsAt, eventTimezone);
	return isSameDay(calendarDateZoned, startsAtZoned);
}

export function formatShortTimestamp(
	timestamp: number,
	locale: string = navigator.language,
	timezone?: string
): string {
	const date = new Date(timestamp);
	const now = new Date();

	// Fix issue 1: Handle timezone undefined case properly
	let isSameDay: boolean;
	let isSameWeek: boolean;

	if (timezone) {
		// Use timezone-aware calculations
		const nowZoned = fromDate(now, timezone);
		const dateZoned = fromDate(date, timezone);

		// Check if same day using timezone-aware comparison
		isSameDay =
			nowZoned.year === dateZoned.year &&
			nowZoned.month === dateZoned.month &&
			nowZoned.day === dateZoned.day;

		// Calculate start of week in the same timezone
		const startOfWeekZoned = nowZoned
			.subtract({ days: nowZoned.toDate().getDay() })
			.set({ hour: 0, minute: 0, second: 0, millisecond: 0 });

		isSameWeek = dateZoned.compare(startOfWeekZoned) >= 0 && !isSameDay;
	} else {
		// Use local timezone calculations when no timezone is provided
		isSameDay = date.toDateString() === now.toDateString();

		const startOfWeek = new Date(now);
		startOfWeek.setHours(0, 0, 0, 0);
		startOfWeek.setDate(now.getDate() - now.getDay());

		isSameWeek = date >= startOfWeek && !isSameDay;
	}

	const formatter = new Intl.DateTimeFormat(
		locale,
		(() => {
			const base: Intl.DateTimeFormatOptions = timezone ? { timeZone: timezone } : {};
			if (isSameDay) {
				return {
					...base,
					hour: 'numeric',
					minute: '2-digit'
				};
			} else if (isSameWeek) {
				return {
					...base,
					weekday: 'short',
					hour: 'numeric',
					minute: '2-digit'
				};
			} else {
				return {
					...base,
					day: '2-digit',
					month: '2-digit',
					year: '2-digit',
					hour: 'numeric',
					minute: '2-digit'
				};
			}
		})()
	);

	return formatter.format(date).replaceAll(',', '');
}

export function renderEventTime(
	startsAt: number,
	endsAt: number,
	locale: string | undefined,
	timezone: string
) {
	const startsAtZoned = fromAbsolute(startsAt, timezone);
	const endsAtZoned = fromAbsolute(endsAt, timezone);

	// Check if event spans multiple days
	const isSameDay =
		startsAtZoned.year === endsAtZoned.year &&
		startsAtZoned.month === endsAtZoned.month &&
		startsAtZoned.day === endsAtZoned.day;

	const timeFormatter = new Intl.DateTimeFormat(locale, {
		hour: 'numeric',
		minute: 'numeric',
		timeZone: timezone
	});

	if (isSameDay) {
		const dateStr = new Intl.DateTimeFormat(locale, {
			weekday: 'short',
			day: 'numeric',
			month: 'short',
			timeZone: timezone
		}).format(startsAtZoned.toDate());

		const timeStr = `${timeFormatter.format(startsAtZoned.toDate())} - ${timeFormatter.format(endsAtZoned.toDate())}`;
		return { timeStr, dateStr };
	} else {
		const startDateStr = new Intl.DateTimeFormat(locale, {
			weekday: 'short',
			day: 'numeric',
			month: 'short',
			timeZone: timezone
		}).format(startsAtZoned.toDate());

		const endDateStr = new Intl.DateTimeFormat(locale, {
			weekday: 'short',
			day: 'numeric',
			month: 'short',
			timeZone: timezone
		}).format(endsAtZoned.toDate());

		const startTimeStr = timeFormatter.format(startsAtZoned.toDate());
		const endTimeStr = timeFormatter.format(endsAtZoned.toDate());

		const dateStr = `${startDateStr} - ${endDateStr}`;
		const timeStr = `${startTimeStr} - ${endTimeStr}`;
		return { timeStr, dateStr };
	}
}

export function getTimestampFromCalendarDate(
	{ year, month, day }: { year: number; month: number; day: number },
	timezone: string,
	timeOfDay: 'start' | 'end'
): number {
	const calendarDate = new CalendarDate(year, month, day);
	const calendarDateZoned = toZoned(calendarDate, timezone);
	const timeOfDayZoned =
		timeOfDay === 'start'
			? calendarDateZoned.set({ hour: 0, minute: 0, second: 0, millisecond: 0 })
			: calendarDateZoned.set({ hour: 23, minute: 59, second: 59, millisecond: 999 });
	return timeOfDayZoned.toDate().getTime();
}

export function formatDate(timestamp: number): string {
	const date = new Date(timestamp);
	return date.toLocaleDateString();
}

/**
 * Format a date for display in API keys and similar contexts.
 * Handles string, Date, or null values.
 * @param date - Date as string, Date object, or null
 * @returns Formatted date string or "Never expires" for null
 */
export function formatApiKeyDate(date: string | Date | null): string {
	if (!date) return 'Never expires';
	const d = typeof date === 'string' ? new Date(date) : date;
	return new Intl.DateTimeFormat('en-US', {
		year: 'numeric',
		month: 'short',
		day: 'numeric',
		hour: 'numeric',
		minute: '2-digit'
	}).format(d);
}

type DateInputValue = string | null | undefined;

export function inputValueToDate(value: DateInputValue): Date | null {
	if (!value) return null;

	const parts = value.split('-');

	const y = Number(parts[0]);
	if (!Number.isInteger(y) || y < 1) return null;

	// year only → incomplete
	if (parts.length === 1) return null;

	const m = Number(parts[1]);
	if (!Number.isInteger(m) || m < 1 || m > 12) return null;

	// year + month → incomplete
	if (parts.length === 2) return null;

	const d = Number(parts[2]);
	if (!Number.isInteger(d) || d < 1 || d > 31) return null;

	const date = new Date(y, m - 1, d);

	// Guard against invalid dates like 2025-02-31
	if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) {
		return null;
	}

	return date;
}

export function dateToInputValue(date: Date | null | undefined): string | null {
	if (!date || Number.isNaN(date.getTime())) return null;

	const y = date.getFullYear();
	const m = String(date.getMonth() + 1).padStart(2, '0');
	const d = String(date.getDate()).padStart(2, '0');

	return `${y}-${m}-${d}`;
}
