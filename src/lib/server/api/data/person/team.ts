import type { ServerTransaction } from '@rocicorp/zero';
import { type QueryContext, builder } from '$lib/zero/schema';
import { parse } from 'valibot';

import {
	addPersonToTeamMutatorSchemaZero,
	type AddPersonToTeamMutatorSchemaZero
} from '$lib/schema/person';
import {
	removePersonFromTeamMutatorSchemaZero,
	type RemovePersonFromTeamMutatorSchemaZero
} from '$lib/schema/person';
import { activity, person, personTeam, team } from '$lib/schema/drizzle';
import { and, eq } from 'drizzle-orm';
import { v7 as uuidv7 } from 'uuid';
import { updateLatestActivity } from '$lib/server/api/data/person/latestActivity';
import { personReadPermissions } from '$lib/zero/query/person/permissions';
import { teamReadPermissions } from '$lib/zero/query/team/permissions';

import { getOrganizationByIdForAdminOrOwner } from '$lib/server/api/data/organization';
import { getQueue } from '$lib/server/queue';
import { teamPersonWebhook } from '$lib/schema/team';
import { activityWebhook } from '$lib/schema/activity';

export async function addPersonToTeam({
	tx,
	ctx,
	args
}: {
	tx: ServerTransaction;
	ctx: QueryContext;
	args: AddPersonToTeamMutatorSchemaZero;
}) {
	const parsed = parse(addPersonToTeamMutatorSchemaZero, args);
	const personRecord = await tx.run(
		builder.person
			.where('id', '=', parsed.metadata.personId)
			.where('organizationId', '=', parsed.metadata.organizationId)
			.where((expr) => personReadPermissions(expr, ctx))
			.one()
	);
	if (!personRecord) {
		throw new Error('Person not found');
	}

	// make sure we have permissions for the team
	const teamRecord = await tx.run(
		builder.team
			.where('id', '=', args.metadata.teamId)
			.where('organizationId', '=', args.metadata.organizationId)
			.where((expr) => teamReadPermissions(expr, ctx))
			.one()
	);
	if (!teamRecord) {
		throw new Error('Team not found');
	}

	await tx.dbTransaction.wrappedTransaction.insert(personTeam).values({
		personId: parsed.metadata.personId,
		teamId: parsed.metadata.teamId,
		organizationId: parsed.metadata.organizationId,
		createdAt: new Date()
	});
	const queue = await getQueue();
	queue.triggerWebhook({
		organizationId: args.metadata.organizationId,
		payload: {
			type: 'team.person.added',
			data: parse(teamPersonWebhook, {
				teamId: args.metadata.teamId,
				personId: parsed.metadata.personId
			})
		}
	});
}

export async function _addPersonTeamDataUnsafe({
	tx,
	args
}: {
	tx: ServerTransaction;
	args: {
		personId: string;
		teamId: string;
		organizationId: string;
	};
}) {
	const teamRecord = await tx.dbTransaction.wrappedTransaction.query.team.findFirst({
		where: and(eq(team.id, args.teamId), eq(team.organizationId, args.organizationId))
	});
	if (!teamRecord) {
		throw new Error('Team not found');
	}
	const personRecord = await tx.dbTransaction.wrappedTransaction.query.person.findFirst({
		where: and(eq(person.id, args.personId), eq(person.organizationId, args.organizationId))
	});
	if (!personRecord) {
		throw new Error('Person not found');
	}
	const [inserted] = await tx.dbTransaction.wrappedTransaction
		.insert(personTeam)
		.values({
			personId: args.personId,
			teamId: args.teamId,
			organizationId: args.organizationId,
			createdAt: new Date()
		})
		.onConflictDoNothing()
		.returning();
	if (!inserted) {
		return null;
	}

	const [teamActivity] = await tx.dbTransaction.wrappedTransaction
		.insert(activity)
		.values({
			id: uuidv7(),
			type: 'team_added',
			referenceId: args.teamId,
			unread: false,
			userId: null,
			organizationId: args.organizationId,
			createdAt: new Date(),
			personId: args.personId
		})
		.returning();
	if (teamActivity) {
		const { organizationId: actOrg, ...actData } = teamActivity;
		const actQueue = await getQueue();
		actQueue.triggerWebhook({
			organizationId: actOrg,
			payload: {
				type: 'activity.created',
				data: parse(activityWebhook, actData)
			}
		});
	}

	await updateLatestActivity({
		tx,
		args: {
			personId: args.personId,
			organizationId: args.organizationId,
			activityPreview: {
				type: 'team_added',
				teamName: teamRecord.name,
				teamId: args.teamId
			}
		}
	});
	const queue = await getQueue();
	queue.triggerWebhook({
		organizationId: args.organizationId,
		payload: {
			type: 'team.person.added',
			data: parse(teamPersonWebhook, { teamId: args.teamId, personId: args.personId })
		}
	});
	return inserted;
}

export async function removePersonFromTeam({
	tx,
	ctx,
	args
}: {
	tx: ServerTransaction;
	ctx: QueryContext;
	args: RemovePersonFromTeamMutatorSchemaZero;
}) {
	const parsed = parse(removePersonFromTeamMutatorSchemaZero, args);
	await getOrganizationByIdForAdminOrOwner({
		organizationId: parsed.metadata.organizationId,
		ctx,
		tx
	});
	await tx.dbTransaction.wrappedTransaction
		.delete(personTeam)
		.where(
			and(
				eq(personTeam.personId, parsed.metadata.personId),
				eq(personTeam.teamId, parsed.metadata.teamId),
				eq(personTeam.organizationId, parsed.metadata.organizationId)
			)
		);
	const queue = await getQueue();
	queue.triggerWebhook({
		organizationId: parsed.metadata.organizationId,
		payload: {
			type: 'team.person.removed',
			data: parse(teamPersonWebhook, {
				teamId: parsed.metadata.teamId,
				personId: parsed.metadata.personId
			})
		}
	});
}
