import { drizzle } from '$lib/server/db';
import { sql } from 'drizzle-orm';
import type { QueryContext } from '$lib/zero/schema';
import { _listOrganizationMembershipsByUserIdUnsafe } from '$lib/server/api/data/organization';

export async function getQueryContext(userId: string): Promise<QueryContext> {
	const authTeams = await getAuthedTeams(userId);
	const memberships = await _listOrganizationMembershipsByUserIdUnsafe({ userId });
	const ownerOrgs = memberships.filter((m) => m.role === 'owner').map((m) => m.organizationId);
	const adminOrgs = memberships.filter((m) => m.role === 'admin').map((m) => m.organizationId);
	const otherOrgs = memberships
		.filter((m) => m.role !== 'owner' && m.role !== 'admin')
		.map((m) => m.organizationId);
	return {
		userId,
		authTeams,
		adminOrgs,
		ownerOrgs,
		otherOrgs
	};
}

export async function getApiQueryContext(organizationId: string): Promise<QueryContext> {
	return {
		userId: null,
		authTeams: [],
		adminOrgs: [organizationId],
		ownerOrgs: [organizationId],
		otherOrgs: [organizationId]
	};
}

export async function getAuthedTeams(userId: string) {
	const result = await drizzle.execute(sql`
   WITH RECURSIVE auth_teams AS (
    SELECT t.id
    FROM "team" t
    JOIN team_member tm ON tm.team_id = t.id
    WHERE tm.user_id = ${userId}
    UNION ALL

    SELECT t.id
    FROM "team" t
    JOIN auth_teams autht ON t.parent_team_id = autht.id
  )
  SELECT id FROM auth_teams;
`);

	return result.map((team) => team.id as string);
}

export async function getAdminOwnerOrgs(userId: string) {
	const result = await drizzle.query.member.findMany({
		where: (row, { eq, and, or }) =>
			and(eq(row.userId, userId), or(eq(row.role, 'admin'), eq(row.role, 'owner')))
	});
	const ownerOrgs = result
		.filter((member) => member.role === 'owner')
		.map((member) => member.organizationId);
	const adminOrgs = result
		.filter((member) => member.role === 'admin')
		.map((member) => member.organizationId);

	return { owner: ownerOrgs, admin: adminOrgs };
}
