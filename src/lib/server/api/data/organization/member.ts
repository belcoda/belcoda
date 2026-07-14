import type { ServerTransaction } from '@rocicorp/zero';
import { and, eq, sql } from 'drizzle-orm';
import { drizzle } from '$lib/server/db';
import { member } from '$lib/schema/drizzle';
import {
	defaultMemberSettings,
	parseMemberSettings,
	type MemberNotificationSettingsPatchSchema
} from '$lib/schema/member/settings';

export async function getOrganizationMember({
	tx,
	args
}: {
	tx: ServerTransaction;
	args: { organizationId: string; userId: string };
}) {
	const memberRecord = await tx.dbTransaction.wrappedTransaction.query.member.findFirst({
		where: and(eq(member.organizationId, args.organizationId), eq(member.userId, args.userId))
	});
	if (!memberRecord) {
		throw new Error('Member not found');
	}
	return memberRecord;
}

export async function getMemberSettings({
	userId,
	organizationId
}: {
	userId: string;
	organizationId: string;
}) {
	const row = await drizzle.query.member.findFirst({
		where: and(eq(member.userId, userId), eq(member.organizationId, organizationId)),
		columns: { settings: true }
	});
	return parseMemberSettings(row?.settings) ?? defaultMemberSettings();
}

export async function updateMemberSettings({
	userId,
	organizationId,
	notifications
}: {
	userId: string;
	organizationId: string;
	notifications: MemberNotificationSettingsPatchSchema;
}) {
	const defaultNotifications = JSON.stringify(defaultMemberSettings().notifications);
	const notificationPatch = JSON.stringify(notifications);

	const updated = await drizzle
		.update(member)
		.set({
			settings: sql`
				COALESCE(${member.settings}, '{}'::jsonb)
				|| jsonb_build_object(
					'notifications',
					COALESCE(${member.settings}->'notifications', ${defaultNotifications}::jsonb)
					|| ${notificationPatch}::jsonb
				)
			`
		})
		.where(and(eq(member.userId, userId), eq(member.organizationId, organizationId)))
		.returning({ id: member.id });

	if (!updated.length) {
		throw new Error('Member not found');
	}
}
