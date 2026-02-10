import type { ServerTransaction } from '@rocicorp/zero';
import { type QueryContext, builder } from '$lib/zero/schema';
import { parse } from 'valibot';
import {
	addPersonTagMutatorSchemaZero,
	type AddPersonTagMutatorSchemaZero,
	type RemovePersonTagMutatorSchemaZero
} from '$lib/schema/person';
import { personReadPermissions } from '$lib/zero/query/person/permissions';
import { tagReadPermissions } from '$lib/zero/query/tag/permissions';
import { personTag } from '$lib/schema/drizzle';
import { eq, and } from 'drizzle-orm';

export async function addPersonTag({
	tx,
	ctx,
	args
}: {
	tx: ServerTransaction;
	ctx: QueryContext;
	args: AddPersonTagMutatorSchemaZero;
}) {
	const parsed = parse(addPersonTagMutatorSchemaZero, args);
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

	//make sure we have permissions for the tag
	const tagRecord = await tx.run(
		builder.tag
			.where('id', '=', args.metadata.tagId)
			.where('organizationId', '=', args.metadata.organizationId)
			.where((expr) => tagReadPermissions(expr, ctx))
			.one()
	);
	if (!tagRecord) {
		throw new Error('Tag not found');
	}

	const [result] = await tx.dbTransaction.wrappedTransaction
		.insert(personTag)
		.values({
			personId: args.metadata.personId,
			tagId: args.metadata.tagId,
			organizationId: args.metadata.organizationId,
			createdAt: new Date()
		})
		.returning();
	if (!result) {
		throw new Error('Unable to add person tag');
	}
	return result;
}

export async function removePersonTag({
	tx,
	ctx,
	args
}: {
	tx: ServerTransaction;
	ctx: QueryContext;
	args: RemovePersonTagMutatorSchemaZero;
}) {
	if (
		!ctx.adminOrgs.includes(args.metadata.organizationId) &&
		!ctx.ownerOrgs.includes(args.metadata.organizationId)
	) {
		throw new Error('You are not authorized to remove a person from a tag in this organization');
	}
	await tx.dbTransaction.wrappedTransaction.delete(personTag).where(
		and(
			eq(personTag.personId, args.metadata.personId),
			eq(personTag.tagId, args.metadata.tagId),
			eq(personTag.organizationId, args.metadata.organizationId) // make sure the tag and person belongs to the organization
		)
	);
}
