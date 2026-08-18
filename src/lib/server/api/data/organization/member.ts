import type { ServerTransaction } from '@rocicorp/zero';
import { and, eq, sql } from 'drizzle-orm';
import { drizzle } from '$lib/server/db';
import { member } from '$lib/schema/drizzle';
import {
	defaultMemberOnboardingSettings,
	defaultMemberSettings,
	resolveMemberSettings,
	type MemberNotificationSettingsPatchSchema,
	type MemberOnboardingSettingsPatchSchema
} from '$lib/schema/member/settings';
import type { InferredMemberOnboardingStep } from '$lib/schema/member/onboarding';

function memberOnboardingSettingsUpdate(onboarding: MemberOnboardingSettingsPatchSchema) {
	const defaultOnboarding = JSON.stringify(defaultMemberOnboardingSettings('complete'));
	const onboardingPatch = JSON.stringify(onboarding);

	return sql`
		COALESCE(${member.settings}, '{}'::jsonb)
		|| jsonb_build_object(
			'onboarding',
			${defaultOnboarding}::jsonb
			|| COALESCE(${member.settings}->'onboarding', '{}'::jsonb)
			|| ${onboardingPatch}::jsonb
		)
	`;
}

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
	return resolveMemberSettings(row?.settings);
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

export async function updateMemberOnboarding({
	userId,
	organizationId,
	onboarding
}: {
	userId: string;
	organizationId: string;
	onboarding: MemberOnboardingSettingsPatchSchema;
}) {
	const updated = await drizzle
		.update(member)
		.set({
			settings: memberOnboardingSettingsUpdate(onboarding)
		})
		.where(and(eq(member.userId, userId), eq(member.organizationId, organizationId)))
		.returning({ id: member.id });

	if (!updated.length) {
		throw new Error('Member not found');
	}
}

export async function completeInferredMemberOnboardingStepInTransaction({
	tx,
	userId,
	organizationId,
	step
}: {
	tx: ServerTransaction;
	userId: string;
	organizationId: string;
	step: InferredMemberOnboardingStep;
}) {
	await tx.dbTransaction.wrappedTransaction
		.update(member)
		.set({ settings: memberOnboardingSettingsUpdate({ [step]: 'complete' }) })
		.where(
			and(
				eq(member.userId, userId),
				eq(member.organizationId, organizationId),
				sql`COALESCE(${member.settings}->'onboarding'->>${step}, 'complete') = 'pending'`
			)
		);
}

export async function completeInferredMemberOnboardingStepForUserInTransaction({
	tx,
	userId,
	step
}: {
	tx: ServerTransaction;
	userId: string;
	step: InferredMemberOnboardingStep;
}) {
	await tx.dbTransaction.wrappedTransaction
		.update(member)
		.set({ settings: memberOnboardingSettingsUpdate({ [step]: 'complete' }) })
		.where(
			and(
				eq(member.userId, userId),
				sql`COALESCE(${member.settings}->'onboarding'->>${step}, 'complete') = 'pending'`
			)
		);
}

export async function completeMemberLanguageOnboarding({ userId }: { userId: string }) {
	await drizzle
		.update(member)
		.set({
			settings: memberOnboardingSettingsUpdate({ language: 'complete' })
		})
		.where(
			and(
				eq(member.userId, userId),
				sql`COALESCE(${member.settings}->'onboarding'->>'language', 'complete') = 'pending'`
			)
		);
}
