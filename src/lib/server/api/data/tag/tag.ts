import type { ServerTransaction } from '@rocicorp/zero';
import type { QueryContext } from '$lib/zero/schema';
import { tag } from '$lib/schema/drizzle';
import { and, eq } from 'drizzle-orm';
import { parse } from 'valibot';
import {
	type UpdateMutatorSchema,
	updateMutatorSchema,
	type CreateMutatorSchema,
	createMutatorSchema
} from '$lib/schema/tag';

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
		.where(eq(tag.name, parsed.input.name))
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
		.where(eq(tag.id, parsed.metadata.tagId))
		.returning();
	if (!result) {
		throw new Error('Unable to update tag');
	}
	return result;
}
