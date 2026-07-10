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

type DigestFrequency = 'daily' | 'weekly';
type DigestCounts = { sent: number; skipped: number; failed: number };

export async function sendDigest({
	frequency = 'weekly'
}: {
	frequency?: DigestFrequency;
} = {}) {
	const { POSTMARK_DIGEST_TEMPLATE_ALIAS } = env;
	const { PUBLIC_HOST } = publicEnv;

	const template = POSTMARK_DIGEST_TEMPLATE_ALIAS ?? 'notification-digest';
	const appUrl = PUBLIC_HOST.replace(/\/$/, '');
	const periodLabel = weekOf();

	const targetUsers = await listDigestUsers(frequency);

	log.info({ count: targetUsers.length, frequency }, 'Sending digest');

	const totals: DigestCounts = { sent: 0, skipped: 0, failed: 0 };

	for (const targetUser of targetUsers) {
		addCounts(
			totals,
			await sendDigestForUser({
				targetUser,
				template,
				appUrl,
				periodLabel
			})
		);
	}

	log.info(totals, 'Digest complete');
}

function addCounts(totals: DigestCounts, update: DigestCounts) {
	totals.sent += update.sent;
	totals.skipped += update.skipped;
	totals.failed += update.failed;
}

async function listDigestUsers(frequency: DigestFrequency) {
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

	return eligibleUsers.filter(
		(u) => (u.settings?.notifications?.digestFrequency ?? 'weekly') === frequency
	);
}

type DigestUser = Awaited<ReturnType<typeof listDigestUsers>>[number];

async function sendDigestForUser({
	targetUser,
	template,
	appUrl,
	periodLabel
}: {
	targetUser: DigestUser;
	template: string;
	appUrl: string;
	periodLabel: string;
}): Promise<DigestCounts> {
	let sent = 0;

	try {
		if (!targetUser.email) {
			return { sent, skipped: 1, failed: 0 };
		}

		const rows = await listUnreadDigestRows(targetUser.id);
		if (rows.length === 0) {
			return { sent, skipped: 1, failed: 0 };
		}

		for (const digest of groupNotificationsByOrganization(rows)) {
			await sendOrganizationDigest({
				digest,
				to: targetUser.email,
				template,
				appUrl,
				periodLabel
			});
			sent++;
		}

		return { sent, skipped: 0, failed: 0 };
	} catch (err) {
		log.error({ err, userId: targetUser.id }, 'Failed to send digest for user');
		return { sent, skipped: 0, failed: 1 };
	}
}

async function listUnreadDigestRows(userId: string) {
	return drizzle
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
		.where(and(eq(notification.userId, userId), eq(notification.status, 'unread')));
}

type UnreadDigestRow = Awaited<ReturnType<typeof listUnreadDigestRows>>[number];
type OrganizationDigest = {
	org: UnreadDigestRow['organization'];
	notifications: UnreadDigestRow[];
};

function groupNotificationsByOrganization(rows: UnreadDigestRow[]): OrganizationDigest[] {
	const byOrg = new Map<string, OrganizationDigest>();

	for (const row of rows) {
		const digest = byOrg.get(row.organizationId);
		if (digest) {
			digest.notifications.push(row);
			continue;
		}

		byOrg.set(row.organizationId, { org: row.organization, notifications: [row] });
	}

	return [...byOrg.values()];
}

async function sendOrganizationDigest({
	digest,
	to,
	template,
	appUrl,
	periodLabel
}: {
	digest: OrganizationDigest;
	to: string;
	template: string;
	appUrl: string;
	periodLabel: string;
}) {
	const { org, notifications } = digest;
	const emailSignature = await getEmailSignature({
		emailFromSignatureId: org.settings?.email?.defaultFromSignatureId,
		organization: org
	});
	const context = buildDigestContext({
		notifications,
		organizationName: org.name,
		organizationId: org.id,
		weekOf: periodLabel,
		appUrl
	});

	await sendTemplateEmail({
		to,
		from: `${emailSignature.name} <${emailSignature.emailAddress}>`,
		template,
		stream: 'broadcast',
		context,
		replyTo: emailSignature.replyTo ?? undefined
	});
}
