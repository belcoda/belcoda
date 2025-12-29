import { event, organization, person } from '$lib/schema/drizzle';
import { env } from '$env/dynamic/public';
import { type Locale } from '$lib/utils/language';
const { PUBLIC_ROOT_DOMAIN } = env;
import { dev } from '$app/environment';

type Input = {
	organization: typeof organization.$inferSelect;
	locale: Locale;
	event: typeof event.$inferSelect;
	person: typeof person.$inferSelect;
};

import { renderEventTime } from '$lib/utils/date';
import { renderAddress } from '$lib/utils/string/address';

export function eventRegistration(options: Input) {
	const eventUrl = `${dev ? 'http://' : 'https://'}${options.organization.slug}.${PUBLIC_ROOT_DOMAIN}/events/${options.event.slug}`;
	const workspaceUrl = `${dev ? 'http://' : 'https://'}${options.organization.slug}.${PUBLIC_ROOT_DOMAIN}`;
	const eventTime = renderEventTime(
		options.event.startsAt.getTime(),
		options.event.endsAt.getTime(),
		options.locale,
		options.event.timezone
	);
	return {
		title: options.event.title,
		featureImage: options.event.featureImage || null,
		featureImageAlt: options.event.title,
		subject: `Registration complete: ${options.event.title}`,
		action: 'Signup',
		language: options.locale,
		previewText: `${eventTime.timeStr} ${eventTime.dateStr}`,
		details: {
			text: {
				when: 'When',
				where: 'Where',
				link: 'Link'
			},
			isOnline: options.event.onlineLink !== null,
			dateTime: `${eventTime.timeStr} ${eventTime.dateStr}`,
			address: renderAddress({
				addressLine1: options.event.addressLine1,
				addressLine2: options.event.addressLine2,
				locality: options.event.locality,
				region: options.event.region,
				country: options.event.country,
				postcode: options.event.postcode,
				locale: options.locale
			}),
			onlineUrl: options.event.onlineLink,
			hasAttachments: (options.event.settings.attachments &&
				options.event.settings.attachments.length > 0)!, //needed for mustache flag
			attachments: options.event.settings.attachments || []
		},
		buttonText: 'Event details',
		buttonUrl: eventUrl,
		instanceName: options.organization.name,
		logoUrl: options.organization.logo || null,
		logoAlt: `${options.organization.name} logo`,
		instanceUrl: workspaceUrl,
		buttonAltHtml: 'Event details',
		buttonAltText: 'Event details',
		copyright: `© Copyright ${new Date().getFullYear()} ${options.organization.name}`
	};
}

export function eventReminder(options: Input) {
	const eventUrl = `${dev ? 'http://' : 'https://'}${options.organization.slug}.${PUBLIC_ROOT_DOMAIN}/events/${options.event.slug}`;
	const workspaceUrl = `${dev ? 'http://' : 'https://'}${options.organization.slug}.${PUBLIC_ROOT_DOMAIN}`;
	const eventTime = renderEventTime(
		options.event.startsAt.getTime(),
		options.event.endsAt.getTime(),
		options.locale,
		options.event.timezone
	);
	return {
		title: options.event.title,
		featureImage: options.event.featureImage || null,
		featureImageAlt: options.event.title,
		subject: `Event reminder: ${options.event.title}`,
		action: 'Reminder',
		language: options.locale,
		previewText: `${eventTime.timeStr} ${eventTime.dateStr}`,
		details: {
			text: {
				when: 'When',
				where: 'Where',
				link: 'Link'
			},
			isOnline: options.event.onlineLink !== null,
			dateTime: `${eventTime.timeStr} ${eventTime.dateStr}`,
			address: renderAddress({
				addressLine1: options.event.addressLine1,
				addressLine2: options.event.addressLine2,
				locality: options.event.locality,
				region: options.event.region,
				country: options.event.country,
				postcode: options.event.postcode,
				locale: options.locale
			}),
			onlineUrl: options.event.onlineLink,
			hasAttachments: (options.event.settings.attachments &&
				options.event.settings.attachments.length > 0)!, //needed for mustache flag
			attachments: options.event.settings.attachments || []
		},
		buttonText: 'Event details',
		buttonUrl: eventUrl,
		instanceName: options.organization.name,
		logoUrl: options.organization.logo || null,
		logoAlt: `${options.organization.name} logo`,
		instanceUrl: workspaceUrl,
		buttonAltHtml: 'Event details',
		buttonAltText: 'Event details',
		copyright: `© Copyright ${new Date().getFullYear()} ${options.organization.name}`
	};
}

export function eventCancellation(options: Input) {
	const workspaceUrl = `${dev ? 'http://' : 'https://'}${options.organization.slug}.${PUBLIC_ROOT_DOMAIN}`;
	const eventTime = renderEventTime(
		options.event.startsAt.getTime(),
		options.event.endsAt.getTime(),
		options.locale,
		options.event.timezone
	);
	return {
		title: options.event.title,
		featureImage: options.event.featureImage || null,
		featureImageAlt: options.event.title,
		subject: `Event Cancelled: ${options.event.title}`,
		action: 'Event has been cancelled',
		language: options.locale,
		previewText: `Unfortunately, this event has been cancelled: ${eventTime.timeStr} ${eventTime.dateStr}`,
		details: {
			text: {
				when: 'When',
				where: 'Where',
				link: 'Event Details'
			},
			isOnline: options.event.onlineLink !== null,
			dateTime: `${eventTime.timeStr} ${eventTime.dateStr}`,
			address: renderAddress({
				addressLine1: options.event.addressLine1,
				addressLine2: options.event.addressLine2,
				locality: options.event.locality,
				region: options.event.region,
				country: options.event.country,
				postcode: options.event.postcode,
				locale: options.locale
			}),
			onlineUrl: options.event.onlineLink
		},
		buttonText: 'View Upcoming Events',
		buttonUrl: `${workspaceUrl}/events`,
		instanceName: options.organization.name,
		logoUrl: options.organization.logo || null,
		logoAlt: `${options.organization.name} logo`,
		instanceUrl: workspaceUrl,
		buttonAltHtml: 'View Upcoming Events',
		buttonAltText: 'View Upcoming Events',
		copyright: `© Copyright ${new Date().getFullYear()} ${options.organization.name}`
	};
}
