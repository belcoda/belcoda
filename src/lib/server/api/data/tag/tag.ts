import type { ServerTransaction } from '@rocicorp/zero';
import type { QueryContext } from '$lib/zero/schema';
import { tag } from '$lib/schema/drizzle';
import { and, eq, isNull } from 'drizzle-orm';
import { parse } from 'valibot';
import {
	type UpdateMutatorSchema,
	updateMutatorSchema,
	type CreateMutatorSchema,
	createMutatorSchema,
	type DeleteMutatorSchema,
	deleteMutatorSchema,
	tagWebhook
} from '$lib/schema/tag';
import { getQueue, queueSendOptionsFromTransaction } from '$lib/server/queue';

export async function createTag({
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
		throw new Error('You are not authorized to create a tag in this organization');
	}
	const [existingTag] = await tx.dbTransaction.wrappedTransaction
		.select()
		.from(tag)
		.where(
			and(eq(tag.name, parsed.input.name), eq(tag.organizationId, parsed.metadata.organizationId))
		)
		.limit(1);
	if (existingTag) {
		throw new Error('A tag with this name already exists for this organization');
	}
	const tagToInsert: typeof tag.$inferInsert = {
		id: parsed.metadata.tagId,
		organizationId: parsed.metadata.organizationId,
		name: parsed.input.name,
		active: true,
		createdAt: new Date(),
		updatedAt: new Date()
	};
	const [result] = await tx.dbTransaction.wrappedTransaction
		.insert(tag)
		.values(tagToInsert)
		.returning();
	if (!result) {
		throw new Error('Unable to create tag');
	}
	const { organizationId, ...tagData } = result;
	const queue = await getQueue();
	await queue.triggerWebhook(
		{
			organizationId,
			payload: {
				type: 'tag.created',
				data: parse(tagWebhook, tagData)
			}
		},
		queueSendOptionsFromTransaction(tx)
	);
	return result;
}

export async function updateTag({
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
		throw new Error('You are not authorized to update a tag in this organization');
	}
	const [result] = await tx.dbTransaction.wrappedTransaction
		.update(tag)
		.set({
			name: parsed.input.name,
			active: parsed.input.active,
			updatedAt: new Date()
		})
		.where(
			and(eq(tag.id, parsed.metadata.tagId), eq(tag.organizationId, parsed.metadata.organizationId))
		)
		.returning();
	if (!result) {
		throw new Error('Unable to update tag');
	}
	const { organizationId, ...tagData } = result;
	const queue = await getQueue();
	await queue.triggerWebhook(
		{
			organizationId,
			payload: {
				type: 'tag.updated',
				data: parse(tagWebhook, tagData)
			}
		},
		queueSendOptionsFromTransaction(tx)
	);
	return result;
}

export async function deleteTag({
	tx,
	ctx,
	args
}: {
	tx: ServerTransaction;
	ctx: QueryContext;
	args: DeleteMutatorSchema;
}) {
	const parsed = parse(deleteMutatorSchema, args);
	if (![...ctx.adminOrgs, ...ctx.ownerOrgs].includes(parsed.metadata.organizationId)) {
		throw new Error('You are not authorized to delete a tag in this organization');
	}
	const [updated] = await tx.dbTransaction.wrappedTransaction
		.update(tag)
		.set({ deletedAt: new Date() })
		.where(
			and(
				eq(tag.id, parsed.metadata.tagId),
				eq(tag.organizationId, parsed.metadata.organizationId),
				isNull(tag.deletedAt)
			)
		)
		.returning();
	if (updated) {
		const queue = await getQueue();
		await queue.triggerWebhook(
			{
				organizationId: updated.organizationId,
				payload: {
					type: 'tag.deleted',
					data: { tagId: updated.id }
				}
			},
			queueSendOptionsFromTransaction(tx)
		);
	}
}
