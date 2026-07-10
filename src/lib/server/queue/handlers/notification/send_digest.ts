import pino from '$lib/pino';
import { drizzle } from '$lib/server/db';
import { notification, user, organization } from '$lib/schema/drizzle';
import { and, eq, isNull, or, sql } from 'drizzle-orm';
import { buildDigestContext } from '$lib/server/utils/email/digest_context';
import sendTemplateEmail from '$lib/server/utils/email/send_template_email';
import { env } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';
import { getEmailSignature } from '$lib/server/utils/email/signature';

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
	const { POSTMARK_DIGEST_TEMPLATE_ALIAS } = env;
	const { PUBLIC_HOST } = publicEnv;

	const template = POSTMARK_DIGEST_TEMPLATE_ALIAS ?? 'notification-digest';
	const appUrl = PUBLIC_HOST.replace(/\/$/, '');

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
					organization,
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

			const byOrg = new Map<
				string,
				{ org: (typeof rows)[number]['organization']; notifications: typeof rows }
			>();
			for (const row of rows) {
				if (!byOrg.has(row.organizationId)) {
					byOrg.set(row.organizationId, { org: row.organization, notifications: [] });
				}
				byOrg.get(row.organizationId)!.notifications.push(row);
			}

			for (const [, { org, notifications: orgRows }] of byOrg) {
				const emailFromSignatureId = org.settings.email.defaultFromSignatureId;
				const emailSignature = await getEmailSignature({
					emailFromSignatureId,
					organization: org
				});
				if (!emailSignature.name || !emailSignature.emailAddress) {
					log.error(
						{ userId: targetUser.id, organizationId: org.id, emailFromSignatureId },
						'Missing email from signature for digest'
					);
					failed++;
					continue;
				}
				const from = `${emailSignature.name} <${emailSignature.emailAddress}>`;
				const context = buildDigestContext({
					notifications: orgRows,
					organizationName: org.name,
					organizationId: org.id,
					weekOf: weekOf(),
					appUrl
				});

				await sendTemplateEmail({
					to: targetUser.email,
					from,
					template,
					stream: 'broadcast',
					context,
					replyTo: emailSignature.replyTo ?? undefined
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
