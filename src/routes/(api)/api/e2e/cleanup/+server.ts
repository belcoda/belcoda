import type { RequestHandler } from '@sveltejs/kit';
import { drizzle } from '$lib/server/db';
import { eq, like, inArray, sql } from 'drizzle-orm';
import * as schema from '$lib/schema/drizzle';
import { env } from '$env/dynamic/private';
import { error, json } from '@sveltejs/kit';

const TEST_ORG_SLUG = 'e2e-test-organization';
const TEST_USER_EMAIL_PATTERN = 'e2e-%@belcoda.test';

async function deleteTestOrganizationScopedRows(orgId: string) {
	const people = await drizzle
		.select({ id: schema.person.id })
		.from(schema.person)
		.where(eq(schema.person.organizationId, orgId));
	const personIds = people.map((p) => p.id);

	await drizzle
		.update(schema.session)
		.set({ activeOrganizationId: null })
		.where(eq(schema.session.activeOrganizationId, orgId));

	const orgTeams = await drizzle
		.select({ id: schema.team.id })
		.from(schema.team)
		.where(eq(schema.team.organizationId, orgId));
	const orgTeamIds = orgTeams.map((t) => t.id);
	if (orgTeamIds.length > 0) {
		await drizzle
			.update(schema.session)
			.set({ activeTeamId: null })
			.where(inArray(schema.session.activeTeamId, orgTeamIds));
	}

	if (personIds.length > 0) {
		await drizzle
			.delete(schema.emailSendQueue)
			.where(inArray(schema.emailSendQueue.personId, personIds));
	}

	await drizzle
		.delete(schema.whatsappMessage)
		.where(eq(schema.whatsappMessage.organizationId, orgId));

	await drizzle.delete(schema.eventSignup).where(eq(schema.eventSignup.organizationId, orgId));

	await drizzle
		.delete(schema.petitionSignature)
		.where(eq(schema.petitionSignature.organizationId, orgId));

	await drizzle.delete(schema.activity).where(eq(schema.activity.organizationId, orgId));

	await drizzle.delete(schema.personNote).where(eq(schema.personNote.organizationId, orgId));

	await drizzle.delete(schema.personTag).where(eq(schema.personTag.organizationId, orgId));

	await drizzle.delete(schema.personTeam).where(eq(schema.personTeam.organizationId, orgId));

	await drizzle.delete(schema.personImport).where(eq(schema.personImport.organizationId, orgId));

	await drizzle.delete(schema.actionCode).where(eq(schema.actionCode.organizationId, orgId));

	const webhooks = await drizzle
		.select({ id: schema.webhook.id })
		.from(schema.webhook)
		.where(eq(schema.webhook.organizationId, orgId));
	const webhookIds = webhooks.map((w) => w.id);
	if (webhookIds.length > 0) {
		await drizzle.delete(schema.webhookLog).where(inArray(schema.webhookLog.webhookId, webhookIds));
	}

	await drizzle.delete(schema.webhook).where(eq(schema.webhook.organizationId, orgId));

	await drizzle.delete(schema.emailMessage).where(eq(schema.emailMessage.organizationId, orgId));

	await drizzle
		.delete(schema.emailFromSignature)
		.where(eq(schema.emailFromSignature.organizationId, orgId));

	await drizzle
		.delete(schema.whatsappGroupMember)
		.where(eq(schema.whatsappGroupMember.organizationId, orgId));

	await drizzle
		.delete(schema.whatsappThread)
		.where(eq(schema.whatsappThread.organizationId, orgId));

	await drizzle
		.delete(schema.whatsappTemplate)
		.where(eq(schema.whatsappTemplate.organizationId, orgId));

	await drizzle.delete(schema.whatsappGroup).where(eq(schema.whatsappGroup.organizationId, orgId));

	await drizzle.delete(schema.event).where(eq(schema.event.organizationId, orgId));

	await drizzle.delete(schema.petition).where(eq(schema.petition.organizationId, orgId));

	if (personIds.length > 0) {
		await drizzle.delete(schema.person).where(inArray(schema.person.id, personIds));
	}

	await drizzle.delete(schema.invitation).where(eq(schema.invitation.organizationId, orgId));

	if (orgTeamIds.length > 0) {
		await drizzle.delete(schema.teamMember).where(inArray(schema.teamMember.teamId, orgTeamIds));
	}

	for (;;) {
		const stillHasTeams = await drizzle
			.select({ id: schema.team.id })
			.from(schema.team)
			.where(eq(schema.team.organizationId, orgId))
			.limit(1);
		if (stillHasTeams.length === 0) break;

		const deleteResult = await drizzle.execute(sql`
			DELETE FROM team AS t1
			WHERE t1.organization_id = ${orgId}::uuid
			AND NOT EXISTS (SELECT 1 FROM team AS t2 WHERE t2.parent_team_id = t1.id)
			RETURNING t1.id
		`);

		const deletedCount = (deleteResult as unknown[]).length;

		if (deletedCount === 0) {
			throw new Error(
				`E2E cleanup: drizzle.execute leaf DELETE deleted 0 rows but teams remain for organization ${orgId} (possible circular team.parent_team_id)`
			);
		}
	}

	await drizzle.delete(schema.tag).where(eq(schema.tag.organizationId, orgId));

	await drizzle.delete(schema.member).where(eq(schema.member.organizationId, orgId));

	await drizzle.delete(schema.subscription).where(eq(schema.subscription.referenceId, orgId));

	await drizzle.delete(schema.organization).where(eq(schema.organization.id, orgId));
}

export const POST: RequestHandler = async () => {
	if (env.NODE_ENV === 'production') {
		throw error(403, 'This endpoint is only available in development mode');
	}

	try {
		const testUsers = await drizzle.query.user.findMany({
			where: like(schema.user.email, TEST_USER_EMAIL_PATTERN)
		});
		const testUserIds = testUsers.map((u) => u.id);

		const testOrg = await drizzle.query.organization.findFirst({
			where: eq(schema.organization.slug, TEST_ORG_SLUG)
		});

		if (testUserIds.length > 0) {
			await drizzle
				.update(schema.session)
				.set({ activeOrganizationId: null })
				.where(inArray(schema.session.userId, testUserIds));

			await drizzle.delete(schema.session).where(inArray(schema.session.userId, testUserIds));
		}

		if (testOrg) {
			await deleteTestOrganizationScopedRows(testOrg.id);
		}

		if (testUserIds.length > 0) {
			await drizzle.delete(schema.account).where(inArray(schema.account.userId, testUserIds));
			await drizzle.delete(schema.user).where(inArray(schema.user.id, testUserIds));
		}

		return json({ success: true, message: 'Test data cleaned up' });
	} catch (err) {
		console.error('Failed to cleanup test data:', err);
		throw error(500, 'Failed to cleanup test data');
	}
};
