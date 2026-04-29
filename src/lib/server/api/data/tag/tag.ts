import type { ServerTransaction } from '@rocicorp/zero';
import type { QueryContext } from '$lib/zero/schema';
import type { InferOutput } from 'valibot';
import { listTagsQuery, inputSchema as listTagsInputSchema } from '$lib/zero/query/tag/list';
import { tag } from '$lib/schema/drizzle';
import { and, eq, ilike, inArray, isNotNull, isNull, count, not } from 'drizzle-orm';
import { parse } from 'valibot';
import {
	type UpdateMutatorSchema,
	updateMutatorSchema,
	type CreateMutatorSchema,
	createMutatorSchema,
	type DeleteMutatorSchema,
	deleteMutatorSchema,
	tagApiSchema
} from '$lib/schema/tag';
import { getQueue } from '$lib/server/queue';
import type { ListFilter } from '$lib/schema/helpers';
import { readTagQuery } from '$lib/zero/query/tag/read';
import pino from '$lib/pino';
const log = pino(import.meta.url);

export async function listTags({
	tx,
	ctx,
	input
}: {
	tx: ServerTransaction;
	ctx: QueryContext;
	input: InferOutput<typeof listTagsInputSchema>;
}) {
	return await tx.run(listTagsQuery({ ctx, input }));
}

export async function countTags({
	tx,
	input,
	includeInactive
}: {
	tx: ServerTransaction;
	input: ListFilter;
	includeInactive?: boolean;
}) {
	const isDeleted = input.isDeleted ?? false;
	const whereParts = [
		eq(tag.organizationId, input.organizationId),
		isDeleted ? isNotNull(tag.deletedAt) : isNull(tag.deletedAt)
	];
	if (!includeInactive) {
		whereParts.push(eq(tag.active, true));
	}
	if (input.searchString && input.searchString.length > 0) {
		whereParts.push(ilike(tag.name, `%${input.searchString}%`));
	}
	if (input.excludedIds.length > 0) {
		whereParts.push(not(inArray(tag.id, input.excludedIds)));
	}
	const [result] = await tx.dbTransaction.wrappedTransaction
		.select({ count: count() })
		.from(tag)
		.where(and(...whereParts));
	return result.count;
}

export async function getTag({
	tx,
	ctx,
	args
}: {
	tx: ServerTransaction;
	ctx: QueryContext;
	args: { tagId: string };
}) {
	const row = await tx.run(readTagQuery({ ctx, input: { tagId: args.tagId } }));
	if (!row) {
		throw new Error('Tag not found');
	}
	return row;
}

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
	try {
		const queue = await getQueue();
		await queue.triggerWebhook({
			organizationId,
			payload: {
				type: 'tag.created',
				data: parse(tagApiSchema, tagData)
			}
		});
	} catch (err) {
		log.error({ err }, 'Failed to trigger webhook');
	}
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
	const updates: {
		name?: string;
		active?: boolean;
		updatedAt: Date;
	} = { updatedAt: new Date() };
	if (parsed.input.name !== undefined) {
		updates.name = parsed.input.name;
	}
	if (parsed.input.active !== undefined) {
		updates.active = parsed.input.active;
	}

	const [result] = await tx.dbTransaction.wrappedTransaction
		.update(tag)
		.set(updates)
		.where(
			and(eq(tag.id, parsed.metadata.tagId), eq(tag.organizationId, parsed.metadata.organizationId))
		)
		.returning();
	if (!result) {
		throw new Error('Unable to update tag');
	}
	const { organizationId, ...tagData } = result;
	try {
		const queue = await getQueue();
		await queue.triggerWebhook({
			organizationId,
			payload: {
				type: 'tag.updated',
				data: parse(tagApiSchema, tagData)
			}
		});
	} catch (err) {
		log.error({ err }, 'Failed to trigger webhook');
	}
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
		try {
			const queue = await getQueue();
			await queue.triggerWebhook({
				organizationId: updated.organizationId,
				payload: {
					type: 'tag.deleted',
					data: { tagId: updated.id }
				}
			});
		} catch (err) {
			log.error({ err }, 'Failed to trigger webhook');
		}
	}
}
