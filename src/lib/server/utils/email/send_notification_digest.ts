import sendHtmlEmail from '$lib/server/utils/email/send_html_email';
import { renderer } from './transactional/renderer';
import NotificationDigest from '$lib/emails/templates/NotificationDigest.svelte';
import type { Props as NotificationDigestProps } from '$lib/emails/templates/NotificationDigest.svelte';
import { buildDigestContext } from './digest_context';
import { type Locale } from '$lib/utils/language';
import { t } from '$lib/index.svelte';
import { runWithLocale } from 'wuchale/load-utils/server';
import { fromDate } from '@internationalized/date';

type DigestNotifications = Parameters<typeof buildDigestContext>[0]['notifications'];
type DigestFrequency = 'daily' | 'weekly';

// A daily digest covers a single day, a weekly one the trailing 7-day window,
// so the period label (used in the header and subject) must match the cadence.
// `timeZone` (the organization's default zone) anchors the calendar date and
// year, so a digest sent near midnight isn't labelled with the server's date.
export function formatDigestPeriod(
	locale: Locale,
	frequency: DigestFrequency,
	now = new Date(),
	timeZone?: string
): string {
	const dayMonth: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', timeZone };
	const dayMonthYear: Intl.DateTimeFormatOptions = {
		month: 'short',
		day: 'numeric',
		year: 'numeric',
		timeZone
	};
	const format = (options: Intl.DateTimeFormatOptions, date: Date) =>
		new Intl.DateTimeFormat(locale, options).format(date);
	const yearInZone = (date: Date) => format({ year: 'numeric', timeZone }, date);

	if (frequency === 'daily') {
		return format(dayMonthYear, now);
	}
	// Six calendar days in the org zone (not 144 elapsed hours) so DST
	// transitions do not shift the local start date.
	const start = fromDate(now, timeZone ?? 'UTC')
		.subtract({ days: 6 })
		.toDate();
	if (yearInZone(start) !== yearInZone(now)) {
		return `${format(dayMonthYear, start)} – ${format(dayMonthYear, now)}`;
	}
	return `${format(dayMonth, start)} – ${format(dayMonthYear, now)}`;
}

export async function sendNotificationDigestEmail({
	emailAddress,
	from,
	replyTo,
	locale,
	frequency,
	timeZone,
	notifications,
	organizationName,
	organizationId,
	appUrl
}: {
	emailAddress: string;
	from: string;
	replyTo?: string;
	locale: Locale;
	frequency: DigestFrequency;
	timeZone: string;
	notifications: DigestNotifications;
	organizationName: string;
	organizationId: string;
	appUrl: string;
}) {
	return await runWithLocale(locale, async () => {
		const weekOf = formatDigestPeriod(locale, frequency, new Date(), timeZone);
		const context = buildDigestContext({
			notifications,
			organizationName,
			organizationId,
			weekOf,
			appUrl
		});
		const { totalCount, sections } = context;
		const count = totalCount.toString();
		const heading = totalCount === 1 ? t`${count} notification` : t`${count} notifications`;

		const props: NotificationDigestProps = {
			language: locale,
			appUrl,
			logoAlt: t`Belcoda logo`,
			eyebrow: t`Notification digest`,
			heading,
			organizationName,
			weekOf,
			sections,
			allNotificationsUrl: `${appUrl}/dashboard?org=${organizationId}`,
			ctaText: t`View all notifications`,
			viewText: t`View`,
			previewText: t`${heading} from ${organizationName}`,
			unsubscribeText: t`You're receiving this because you have unread notifications in Belcoda.`,
			unsubscribeLinkText: t`Unsubscribe`,
			copyright: t`Copyright ${new Date().getFullYear().toString()} Belcoda`
		};

		const html = await renderer.render(NotificationDigest, { props });

		await sendHtmlEmail({
			to: emailAddress,
			from,
			html,
			subject: t`Your ${weekOf} digest`,
			stream: 'broadcast',
			replyTo
		});
	});
}
