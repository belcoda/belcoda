import {
	CalendarDate,
	type DateValue,
	ZonedDateTime,
	parseAbsolute,
	toTimeZone,
	Time,
	parseTime
} from '@internationalized/date';

function timestampToZonedDateTime(date: number, timezone: string) {
	const dateValue = parseAbsolute(new Date(date).toISOString(), timezone);
	return dateValue;
}

export function generateCalendarDate(date: number, timezone: string) {
	const newDate = timestampToZonedDateTime(date, timezone);
	return new CalendarDate(newDate.year, newDate.month, newDate.day);
}

export function generateTime(date: number, timezone: string) {
	const newDate = timestampToZonedDateTime(date, timezone);
	return new Time(newDate.hour, newDate.minute, newDate.second, newDate.millisecond);
}

export function generateTimeString(date: number, timezone: string) {
	const time = generateTime(date, timezone);
	return `${time.hour.toString().padStart(2, '0')}:${time.minute.toString().padStart(2, '0')}:${time.second.toString().padStart(2, '0')}`;
}

export function updateTimestampTime(
	newTimeString: string,
	timezone: string,
	currentTimesamp: number
) {
	const newTime = parseTime(newTimeString);
	const currentDate = timestampToZonedDateTime(currentTimesamp, timezone);
	const newDate = currentDate.set({
		hour: newTime.hour,
		minute: newTime.minute,
		second: newTime.second
	});
	return newDate.toDate().getTime();
}

export function updateTimestampDate(
	updatedDateValue: DateValue,
	timezone: string,
	currentTimesamp: number
) {
	const currentDate = timestampToZonedDateTime(currentTimesamp, timezone);
	console.log(currentDate);
	const newDate = currentDate.set({
		year: updatedDateValue.year,
		month: updatedDateValue.month,
		day: updatedDateValue.day
	});
	console.log(newDate);
	return newDate.toDate().getTime();
}

export function createDateTwoWeeksFromNow() {
	const now = new Date();
	const twoWeeksFromNow = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
	return twoWeeksFromNow.getTime();
}

export function convertDateToTimeAtTimezone({
	date,
	timezone,
	hours,
	minutes,
	seconds
}: {
	date: number;
	timezone: string;
	hours: number;
	minutes: number;
	seconds: number;
}) {
	const dateValue = timestampToZonedDateTime(date, timezone).set({
		hour: hours,
		minute: minutes,
		second: seconds
	});
	return dateValue.toDate().getTime();
}

/*
 * Create a new ZonedDateTime object with the new timezone and keep the same time
 * @param dateTime - The ZonedDateTime object to convert
 * @param newTimeZone - The new timezone to convert to
 * @returns The new ZonedDateTime object
 */
export function dateTimeToNewTimeZone(dateTime: ZonedDateTime, newTimeZone: string) {
	const getTimezoneOffset = toTimeZone(dateTime, newTimeZone); //.offset;
	/* const newZonedDateTime = new ZonedDateTime(
		// date
		dateTime.year,
		dateTime.month,
		dateTime.day,
		// timezone and UTC offset
		newTimeZone,
		getTimezoneOffset,
		//time
		dateTime.hour,
		dateTime.minute,
		0,
		0
	); */
	return getTimezoneOffset;
}

export function timestampToNewTimeZone({
	timestamp,
	oldTimeZone,
	newTimeZone
}: {
	timestamp: number;
	oldTimeZone: string;
	newTimeZone: string;
}) {
	const dateTime = timestampToZonedDateTime(timestamp, oldTimeZone);
	const newDateTime = dateTimeToNewTimeZone(dateTime, newTimeZone);
	return newDateTime;
}

export function addDays(timestamp: number, days: number, timezone: string) {
	const dateTime = timestampToZonedDateTime(timestamp, timezone);
	const newDateTime = dateTime.add({ days: days });
	return newDateTime.toDate().getTime();
}
import { type Locale } from '$lib/utils/language';
export function renderDate(timestamp: number, timezone: string, locale: Locale) {
	const dateTime = timestampToZonedDateTime(timestamp, timezone);
	return dateTime.toDate().toLocaleDateString(locale, {
		year: 'numeric',
		month: 'long',
		day: 'numeric'
	});
}

import { env } from '$env/dynamic/public';
const { PUBLIC_ROOT_DOMAIN } = env;
import { dev } from '$app/environment';
export function generateEventPageUrl(slug: string) {
	return `http${dev ? '' : 's'}://${'appState.activeOrganization.data?.slug'}.${PUBLIC_ROOT_DOMAIN}/events/${slug}`;
}
