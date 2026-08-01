import { parseCronExpression } from 'cron-schedule';
import { fromDate, CalendarDateTime } from '@internationalized/date';

/**
 * Compute the next run instant for a cron expression, evaluating the expression in UTC.
 *
 * `cron-schedule` has no timezone support: `getNextDate()` reads a Date's *local* calendar fields
 * and returns a Date built from local fields. Rather than doing offset arithmetic on timestamps
 * (fragile around DST), we use `@internationalized/date` to move explicitly between an absolute
 * instant and its UTC wall-clock fields:
 *
 *   1. project the anchor instant onto its UTC calendar fields;
 *   2. hand cron-schedule a courier Date carrying those fields (it treats them as its local fields);
 *   3. read the matched fields back and re-anchor them to an absolute instant in UTC.
 *
 * Cron expressions are authored/stored in UTC; timezone presentation is handled on the frontend.
 * The returned Date is an absolute instant, stored as-is in a timestamptz column.
 *
 * Note: the step-2 courier borrows the runtime's local calendar. On a non-UTC runtime a cron time
 * that lands in a local DST gap could be normalized; production runs in UTC, where this can't occur.
 */
export function getNextCronRunAtUtc(cronExpression: string, from: Date = new Date()): Date {
	const cron = parseCronExpression(cronExpression);

	// 1. anchor instant -> UTC calendar fields (month is 1-based on ZonedDateTime)
	const anchor = fromDate(from, 'UTC');

	// 2. courier Date carrying the UTC wall-clock as cron-schedule's local fields (Date month is 0-based)
	const courier = new Date(
		anchor.year,
		anchor.month - 1,
		anchor.day,
		anchor.hour,
		anchor.minute,
		anchor.second
	);
	const matched = cron.getNextDate(courier);

	// 3. interpret the matched local fields as UTC and produce the absolute instant
	return new CalendarDateTime(
		matched.getFullYear(),
		matched.getMonth() + 1,
		matched.getDate(),
		matched.getHours(),
		matched.getMinutes(),
		matched.getSeconds()
	).toDate('UTC');
}
