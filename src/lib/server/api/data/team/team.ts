import type { ServerTransaction } from '@rocicorp/zero';
import type { QueryContext } from '$lib/zero/schema';
import { team } from '$lib/schema/drizzle';
import { and, eq } from 'drizzle-orm';
import { parse } from 'valibot';
import {
	type UpdateMutatorSchema,
	updateMutatorSchema,
	type CreateMutatorSchema,
	createMutatorSchema,
	teamWebhook
} from '$lib/schema/team';
import { getQueue } from '$lib/server/queue';
import pino from '$lib/pino';
const log = pino(import.meta.url);

export async function createTeam({
	tx,
	ctx,
	args
}: {
	tx: ServerTransaction;
	ctx: QueryContext;
	args: CreateMutatorSchema;
}) {
	const parsed = parse(createMutatorSchema, args);
	if (![...ctx.adminOrgs, ...ctx.ownerOrgs].includes(parsed.metadata.organizationId)) {
		throw new Error('You are not authorized to create a team in this organization');
	}
	const [existingTeam] = await tx.dbTransaction.wrappedTransaction
		.select()
		.from(team)
		.where(
			and(eq(team.name, parsed.input.name), eq(team.organizationId, parsed.metadata.organizationId))
		)
		.limit(1);
	if (existingTeam) {
		throw new Error('A team with this name already exists for this organization');
	}
	const now = new Date();
	const teamToInsert: typeof team.$inferInsert = {
		id: parsed.metadata.teamId,
		organizationId: parsed.metadata.organizationId,
		name: parsed.input.name,
		parentTeamId: parsed.input.parentTeamId ?? null,
		createdAt: now,
		updatedAt: now,
		deletedAt: null
	};
	const [result] = await tx.dbTransaction.wrappedTransaction
		.insert(team)
		.values(teamToInsert)
		.returning();
	if (!result) {
		throw new Error('Unable to create team');
	}
	const { organizationId, ...teamWebhookData } = result;
	try {
		const queue = await getQueue();
		await queue.triggerWebhook({
			organizationId,
			payload: {
				type: 'team.created',
				data: parse(teamWebhook, teamWebhookData)
			}
		});
	} catch (err) {
		log.error({ err }, 'Failed to trigger webhook');
	}
	return result;
}

export async function updateTeam({
	tx,
	ctx,
	args
}: {
	tx: ServerTransaction;
	ctx: QueryContext;
	args: UpdateMutatorSchema;
}) {
	const parsed = parse(updateMutatorSchema, args);
	if (![...ctx.adminOrgs, ...ctx.ownerOrgs].includes(parsed.metadata.organizationId)) {
		throw new Error('You are not authorized to update a team in this organization');
	}
	const updates: Partial<typeof team.$inferInsert> = {
		updatedAt: new Date()
	};
	if (parsed.input.name !== undefined) {
		updates.name = parsed.input.name;
	}
	if (Object.prototype.hasOwnProperty.call(parsed.input, 'parentTeamId')) {
		updates.parentTeamId = parsed.input.parentTeamId ?? null;
	}
	if (Object.prototype.hasOwnProperty.call(parsed.input, 'deletedAt')) {
		updates.deletedAt = parsed.input.deletedAt ? new Date(parsed.input.deletedAt) : null;
	}
	const [result] = await tx.dbTransaction.wrappedTransaction
		.update(team)
		.set(updates)
		.where(eq(team.id, parsed.metadata.teamId))
		.returning();
	if (!result) {
		throw new Error('Unable to update team');
	}
	const softDeleteThisRequest =
		Object.prototype.hasOwnProperty.call(parsed.input, 'deletedAt') && parsed.input.deletedAt;
	try {
		const queue = await getQueue();
		if (softDeleteThisRequest) {
			await queue.triggerWebhook({
				organizationId: result.organizationId,
				payload: {
					type: 'team.deleted',
					data: { teamId: result.id }
				}
			});
		} else {
			const { organizationId, ...teamWebhookData } = result;
			await queue.triggerWebhook({
				organizationId,
				payload: {
					type: 'team.updated',
					data: parse(teamWebhook, teamWebhookData)
				}
			});
		}
	} catch (err) {
		log.error({ err }, 'Failed to trigger webhook');
	}
	return result;
}
