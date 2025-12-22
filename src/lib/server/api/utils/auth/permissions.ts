import { db } from '$lib/server/db';
import { sql } from 'drizzle-orm';
import type { QueryContext } from '$lib/zero/schema';

export async function getQueryContext(userId: string): Promise<QueryContext> {
	const authTeams = await getAuthedTeams(userId);
	const { admin, owner } = await getAdminOwnerOrgs(userId);
	return {
		userId,
		authTeams,
		adminOrgs: admin,
		ownerOrgs: owner
	};
}

export async function getAuthedTeams(userId: string) {
	const result = await db.execute(sql`
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
	const result = await db.query.member.findMany({
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
