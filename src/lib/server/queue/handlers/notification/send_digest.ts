import pino from '$lib/pino';
import { drizzle } from '$lib/server/db';
import { notification, user, organization, member } from '$lib/schema/drizzle';
import { and, eq, isNull, or, sql } from 'drizzle-orm';
import { sendNotificationDigestEmail } from '$lib/server/utils/email/send_notification_digest';
import { env as publicEnv } from '$env/dynamic/public';
import { getEmailSignature } from '$lib/server/utils/email/signature';
import { clampLocale, type Locale } from '$lib/utils/language';

const log = pino(import.meta.url);

type DigestFrequency = 'daily' | 'weekly';
type DigestCounts = { sent: number; skipped: number; failed: number };

export async function sendDigest({
	frequency = 'weekly'
}: {
	frequency?: DigestFrequency;
} = {}) {
	const { PUBLIC_HOST } = publicEnv;

	const appUrl = PUBLIC_HOST.replace(/\/$/, '');

	const targetUsers = await listDigestUsers(frequency);

	log.info({ count: targetUsers.length, frequency }, 'Sending digest');

	const totals: DigestCounts = { sent: 0, skipped: 0, failed: 0 };

	for (const targetUser of targetUsers) {
		addCounts(
			totals,
			await sendDigestForUser({
				targetUser,
				appUrl,
				frequency
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
		.select({
			id: user.id,
			email: user.email,
			name: user.name,
			preferredLanguage: user.preferredLanguage,
			settings: member.settings
		})
		.from(member)
		.innerJoin(user, eq(member.userId, user.id))
		.where(
			or(
				isNull(member.settings),
				sql`(${member.settings}->'notifications'->>'digestEnabled') IS NULL`,
				sql`(${member.settings}->'notifications'->>'digestEnabled') != 'false'`
			)
		);

	return eligibleUsers.filter(
		(u) => (u.settings?.notifications?.digestFrequency ?? 'weekly') === frequency
	);
}

type DigestUser = Awaited<ReturnType<typeof listDigestUsers>>[number];

async function sendDigestForUser({
	targetUser,
	appUrl,
	frequency
}: {
	targetUser: DigestUser;
	appUrl: string;
	frequency: DigestFrequency;
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

		const locale = clampLocale(targetUser.preferredLanguage ?? 'en');

		for (const digest of groupNotificationsByOrganization(rows)) {
			await sendOrganizationDigest({
				digest,
				to: targetUser.email,
				appUrl,
				locale,
				frequency
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
	appUrl,
	locale,
	frequency
}: {
	digest: OrganizationDigest;
	to: string;
	appUrl: string;
	locale: Locale;
	frequency: DigestFrequency;
}) {
	const { org, notifications } = digest;
	const emailSignature = await getEmailSignature({
		emailFromSignatureId: org.settings?.email?.defaultFromSignatureId,
		organization: org
	});

	await sendNotificationDigestEmail({
		emailAddress: to,
		from: `${emailSignature.name} <${emailSignature.emailAddress}>`,
		replyTo: emailSignature.replyTo ?? undefined,
		locale,
		frequency,
		notifications,
		organizationName: org.name,
		organizationId: org.id,
		appUrl
	});
}
