import pino from '$lib/pino';
import { drizzle } from '$lib/server/db';
import { notification, user, organization } from '$lib/schema/drizzle';
import { and, eq, isNull, or, sql } from 'drizzle-orm';
import { buildDigestContext } from '$lib/server/utils/email/digest_context';
import sendTemplateEmail from '$lib/server/utils/email/send_template_email';
import { env } from '$env/dynamic/private';

const log = pino(import.meta.url);

function weekOf(): string {
	const now = new Date();
	const start = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000);
	const fmt = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' });
	return `${fmt.format(start)} – ${fmt.format(now)}, ${now.getFullYear()}`;
}

export async function sendDigest({
	frequency = 'weekly'
}: {
	frequency?: 'daily' | 'weekly';
} = {}) {
	const { POSTMARK_DIGEST_FROM, POSTMARK_DIGEST_TEMPLATE_ALIAS, PUBLIC_POSTMARK_SENDING_DOMAIN } =
		env;

	const from =
		POSTMARK_DIGEST_FROM ??
		`Belcoda <notifications@${PUBLIC_POSTMARK_SENDING_DOMAIN ?? 'belcoda.com'}>`;
	const template = POSTMARK_DIGEST_TEMPLATE_ALIAS ?? 'notification-digest';
	const appUrl = 'https://app.belcoda.com';

	const eligibleUsers = await drizzle
		.select({ id: user.id, email: user.email, name: user.name, settings: user.settings })
		.from(user)
		.where(
			or(
				isNull(user.settings),
				sql`(${user.settings}->'notifications'->>'digestEnabled') IS NULL`,
				sql`(${user.settings}->'notifications'->>'digestEnabled') != 'false'`
			)
		);

	const targetUsers = eligibleUsers.filter(
		(u) => (u.settings?.notifications?.digestFrequency ?? 'weekly') === frequency
	);

	log.info({ count: targetUsers.length, frequency }, 'Sending digest');

	let sent = 0;
	let skipped = 0;
	let failed = 0;

	for (const targetUser of targetUsers) {
		try {
			if (!targetUser.email) {
				skipped++;
				continue;
			}

			const rows = await drizzle
				.select({
					id: notification.id,
					type: notification.type,
					referenceId: notification.referenceId,
					organizationId: notification.organizationId,
					organizationName: organization.name,
					payload: notification.payload,
					status: notification.status,
					createdAt: notification.createdAt
				})
				.from(notification)
				.innerJoin(organization, eq(notification.organizationId, organization.id))
				.where(and(eq(notification.userId, targetUser.id), eq(notification.status, 'unread')));

			if (rows.length === 0) {
				skipped++;
				continue;
			}

			const byOrg = new Map<string, { orgName: string; notifications: typeof rows }>();
			for (const row of rows) {
				if (!byOrg.has(row.organizationId)) {
					byOrg.set(row.organizationId, { orgName: row.organizationName, notifications: [] });
				}
				byOrg.get(row.organizationId)!.notifications.push(row);
			}

			for (const [, { orgName, notifications: orgRows }] of byOrg) {
				const context = buildDigestContext({
					notifications: orgRows,
					organizationName: orgName,
					weekOf: weekOf(),
					appUrl
				});

				await sendTemplateEmail({
					to: targetUser.email,
					from,
					template,
					stream: 'broadcast',
					context
				});
				sent++;
			}
		} catch (err) {
			log.error({ err, userId: targetUser.id }, 'Failed to send digest for user');
			failed++;
		}
	}

	log.info({ sent, skipped, failed }, 'Digest complete');
}
