import sendHtmlEmail from '$lib/server/utils/email/send_html_email';
import { renderer } from './transactional/renderer';
import NotificationDigest from '$lib/emails/templates/NotificationDigest.svelte';
import type { Props as NotificationDigestProps } from '$lib/emails/templates/NotificationDigest.svelte';
import { buildDigestContext } from './digest_context';
import { type Locale } from '$lib/utils/language';
import { t } from '$lib/index.svelte';
import { runWithLocale } from 'wuchale/load-utils/server';

type DigestNotifications = Parameters<typeof buildDigestContext>[0]['notifications'];
type DigestFrequency = 'daily' | 'weekly';

// A daily digest covers a single day, a weekly one the trailing 7-day window,
// so the period label (used in the header and subject) must match the cadence.
function formatDigestPeriod(locale: Locale, frequency: DigestFrequency): string {
	const now = new Date();
	const fmt = new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric' });
	if (frequency === 'daily') {
		return `${fmt.format(now)}, ${now.getFullYear()}`;
	}
	const start = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000);
	return `${fmt.format(start)} – ${fmt.format(now)}, ${now.getFullYear()}`;
}

export async function sendNotificationDigestEmail({
	emailAddress,
	from,
	replyTo,
	locale,
	frequency,
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
	notifications: DigestNotifications;
	organizationName: string;
	organizationId: string;
	appUrl: string;
}) {
	return await runWithLocale(locale, async () => {
		const weekOf = formatDigestPeriod(locale, frequency);
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
			allNotificationsUrl: `${appUrl}/notifications`,
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
