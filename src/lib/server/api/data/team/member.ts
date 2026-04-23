import type { ServerTransaction } from '@rocicorp/zero';
import { type QueryContext, builder } from '$lib/zero/schema';
import { parse } from 'valibot';
import {
	addUserToTeamMutatorSchema,
	type AddUserToTeamMutatorSchema,
	removeUserFromTeamMutatorSchema,
	type RemoveUserFromTeamMutatorSchema,
	teamUserWebhook
} from '$lib/schema/team';
import { getQueue } from '$lib/server/queue';
import { teamMember, member } from '$lib/schema/drizzle';
import { and, eq } from 'drizzle-orm';
import { teamReadPermissions } from '$lib/zero/query/team/permissions';
import { getOrganizationByIdForAdminOrOwner } from '$lib/server/api/data/organization';
import { v7 as uuidv7 } from 'uuid';
import pino from '$lib/pino';
const log = pino(import.meta.url);

export async function addUserToTeam({
	tx,
	ctx,
	args
}: {
	tx: ServerTransaction;
	ctx: QueryContext;
	args: AddUserToTeamMutatorSchema;
}) {
	const parsed = parse(addUserToTeamMutatorSchema, args);

	await getOrganizationByIdForAdminOrOwner({
		organizationId: parsed.metadata.organizationId,
		ctx,
		tx
	});

	const teamRecord = await tx.run(
		builder.team
			.where('id', '=', parsed.metadata.teamId)
			.where('organizationId', '=', parsed.metadata.organizationId)
			.where((expr) => teamReadPermissions(expr, ctx))
			.one()
	);
	if (!teamRecord) {
		throw new Error('Team not found');
	}

	const [orgMembership] = await tx.dbTransaction.wrappedTransaction
		.select()
		.from(member)
		.where(
			and(
				eq(member.userId, parsed.metadata.userId),
				eq(member.organizationId, parsed.metadata.organizationId)
			)
		)
		.limit(1);
	if (!orgMembership) {
		throw new Error('User is not a member of this organization');
	}

	await tx.dbTransaction.wrappedTransaction.insert(teamMember).values({
		id: uuidv7(),
		userId: parsed.metadata.userId,
		teamId: parsed.metadata.teamId,
		createdAt: new Date()
	});
	const queue = await getQueue();
	queue.triggerWebhook({
		organizationId: parsed.metadata.organizationId,
		payload: {
			type: 'team.user.added',
			data: parse(teamUserWebhook, {
				teamId: parsed.metadata.teamId,
				userId: parsed.metadata.userId
			})
		}
	});
}

export async function removeUserFromTeam({
	tx,
	ctx,
	args
}: {
	tx: ServerTransaction;
	ctx: QueryContext;
	args: RemoveUserFromTeamMutatorSchema;
}) {
	const parsed = parse(removeUserFromTeamMutatorSchema, args);

	await getOrganizationByIdForAdminOrOwner({
		organizationId: parsed.metadata.organizationId,
		ctx,
		tx
	});

	const [result] = await tx.dbTransaction.wrappedTransaction
		.delete(teamMember)
		.where(
			and(
				eq(teamMember.teamId, parsed.metadata.teamId),
				eq(teamMember.userId, parsed.metadata.userId)
			)
		)
		.returning();
	if (result) {
		try {
			const queue = await getQueue();
			await queue.triggerWebhook({
				organizationId: parsed.metadata.organizationId,
				payload: {
					type: 'team.user.removed',
					data: parse(teamUserWebhook, {
						teamId: parsed.metadata.teamId,
						userId: parsed.metadata.userId
					})
				}
			});
		} catch (error) {
			log.error({ error }, 'Unable to trigger webhook');
		}
	}
}
