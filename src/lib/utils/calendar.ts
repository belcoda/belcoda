import type { EventSchema } from '$lib/schema/event';
import type { OrganizationSchema } from '$lib/schema/organization';
import { renderAddress } from '$lib/utils/string/address';
import type { Locale } from '$lib/utils/language';
import { t } from '$lib/index.svelte';

interface CalendarEventData {
	event: EventSchema;
	organization: OrganizationSchema;
	locale: Locale;
}

/**
 * Formats a date to iCal format (YYYYMMDDTHHMMSSZ)
 */
function formatDateForICal(date: Date): string {
	return date
		.toISOString()
		.replace(/[-:]/g, '')
		.replace(/\.\d{3}/, '');
}

/**
 * Escapes text for iCal format
 */
function escapeICalText(text: string | null | undefined): string {
	if (!text) return '';
	return text
		.replace(/\\/g, '\\\\')
		.replace(/;/g, '\\;')
		.replace(/,/g, '\\,')
		.replace(/\n/g, '\\n')
		.replace(/\r/g, '');
}

/**
 * Generates iCal content for an event
 */
export function generateICalContent({
	event,
	organization,
	locale = 'en'
}: CalendarEventData): string {
	const startDate = formatDateForICal(new Date(event.startsAt));
	const endDate = formatDateForICal(new Date(event.endsAt));
	const now = formatDateForICal(new Date());

	// Generate unique ID for the event
	const uid = `event-${event.id}@${organization.slug}`;

	// Prepare location
	let location = '';
	if (event.addressLine1) {
		location = renderAddress({
			addressLine1: event.addressLine1,
			addressLine2: event.addressLine2,
			locality: event.locality,
			region: event.region,
			postcode: event.postcode,
			country: event.country,
			locale
		});
	} else if (event.onlineLink) {
		location = t`Online Event`;
	}

	// Prepare description
	let description = event.shortDescription;
	if (event.onlineLink) {
		description += `\n\n${t`Join online:`} ${event.onlineLink}`;
	}

	// Generate iCal content
	const icalContent = [
		'BEGIN:VCALENDAR',
		'VERSION:2.0',
		'PRODID:-//Belcoda//Event Calendar//EN',
		'CALSCALE:GREGORIAN',
		'METHOD:PUBLISH',
		'BEGIN:VEVENT',
		`UID:${uid}`,
		`DTSTAMP:${now}`,
		`DTSTART:${startDate}`,
		`DTEND:${endDate}`,
		`SUMMARY:${escapeICalText(event.title)}`,
		`DESCRIPTION:${escapeICalText(description)}`,
		...(location ? [`LOCATION:${escapeICalText(location)}`] : []),
		`ORGANIZER;CN=${escapeICalText(organization.name)}:mailto:${organization.settings?.email?.systemFromIdentity?.replyTo || 'noreply@belcoda.com'}`,
		'STATUS:CONFIRMED',
		'TRANSP:OPAQUE',
		'END:VEVENT',
		'END:VCALENDAR'
	].join('\r\n');

	return icalContent;
}

/**
 * Downloads an iCal file for the event
 */
export function downloadICalFile({ event, organization, locale }: CalendarEventData): void {
	const icalContent = generateICalContent({ event, organization, locale });

	// Create blob and download
	const blob = new Blob([icalContent], { type: 'text/calendar;charset=utf-8' });
	const url = URL.createObjectURL(blob);

	// Create download link
	const link = document.createElement('a');
	link.href = url;
	link.download = `${event.slug}-event.ics`;
	link.style.display = 'none';

	// Trigger download
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);

	// Clean up
	URL.revokeObjectURL(url);
}

/**
 * Generates Google Calendar URL
 */
export function generateGoogleCalendarUrl({
	event,
	organization,
	locale
}: CalendarEventData): string {
	const startDate = new Date(event.startsAt)
		.toISOString()
		.replace(/[-:]/g, '')
		.replace(/\.\d{3}Z/, 'Z');
	const endDate = new Date(event.endsAt)
		.toISOString()
		.replace(/[-:]/g, '')
		.replace(/\.\d{3}Z/, 'Z');

	let location = '';
	if (event.addressLine1) {
		location = renderAddress({
			addressLine1: event.addressLine1,
			addressLine2: event.addressLine2,
			locality: event.locality,
			region: event.region,
			postcode: event.postcode,
			country: event.country,
			locale
		});
	} else if (event.onlineLink) {
		location = event.onlineLink;
	}

	let details = event.shortDescription;
	if (event.onlineLink && event.addressLine1) {
		details += `\n\n${t`Join online:`} ${event.onlineLink}`;
	}

	const params = new URLSearchParams({
		action: 'TEMPLATE',
		text: event.title,
		dates: `${startDate}/${endDate}`,
		details: details,
		...(location && { location })
	});

	return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Generates Outlook calendar URL
 */
export function generateOutlookUrl({ event, organization, locale }: CalendarEventData): string {
	const startDate = new Date(event.startsAt).toISOString();
	const endDate = new Date(event.endsAt).toISOString();

	let location = '';
	if (event.addressLine1) {
		location = renderAddress({
			addressLine1: event.addressLine1,
			addressLine2: event.addressLine2,
			locality: event.locality,
			region: event.region,
			postcode: event.postcode,
			country: event.country,
			locale
		});
	} else if (event.onlineLink) {
		location = event.onlineLink;
	}

	let body = event.shortDescription;
	if (event.onlineLink && event.addressLine1) {
		body += `\n\n${t`Join online:`} ${event.onlineLink}`;
	}

	const params = new URLSearchParams({
		subject: event.title,
		startdt: startDate,
		enddt: endDate,
		body: body,
		...(location && { location })
	});

	return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
}
