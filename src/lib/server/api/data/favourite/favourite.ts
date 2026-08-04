import type { ServerTransaction } from '@rocicorp/zero';
import { and, eq } from 'drizzle-orm';
import { parse } from 'valibot';

import {
	addFavouriteMutatorSchemaZero,
	type AddFavouriteMutatorSchemaZero,
	type FavouriteReference,
	removeFavouriteMutatorSchemaZero,
	type RemoveFavouriteMutatorSchemaZero
} from '$lib/schema/favourite';
import { memberFavourite } from '$lib/schema/drizzle';
import { getOrganizationMember } from '$lib/server/api/data/organization/member';
import { eventReadPermissions } from '$lib/zero/query/event/permissions';
import { personReadPermissions } from '$lib/zero/query/person/permissions';
import { petitionReadPermissions } from '$lib/zero/query/petition/permissions';
import { builder, type QueryContext } from '$lib/zero/schema';

async function assertReferenceIsReadable({
	tx,
	ctx,
	organizationId,
	reference
}: {
	tx: ServerTransaction;
	ctx: QueryContext;
	organizationId: string;
	reference: FavouriteReference;
}) {
	let record;
	switch (reference.referenceType) {
		case 'person':
			record = await tx.run(
				builder.person
					.where('id', '=', reference.referenceId)
					.where('organizationId', '=', organizationId)
					.where('deletedAt', 'IS', null)
					.where((expr) => personReadPermissions(expr, ctx))
					.one()
			);
			break;
		case 'petition':
			record = await tx.run(
				builder.petition
					.where('id', '=', reference.referenceId)
					.where('organizationId', '=', organizationId)
					.where('deletedAt', 'IS', null)
					.where((expr) => petitionReadPermissions(expr, ctx))
					.one()
			);
			break;
		case 'event':
			record = await tx.run(
				builder.event
					.where('id', '=', reference.referenceId)
					.where('organizationId', '=', organizationId)
					.where('deletedAt', 'IS', null)
					.where((expr) => eventReadPermissions(expr, ctx))
					.one()
			);
			break;
	}
	if (!record) {
		throw new Error('Favourite reference not found');
	}
}

export async function addFavourite({
	tx,
	ctx,
	args
}: {
	tx: ServerTransaction;
	ctx: QueryContext & { userId: string };
	args: AddFavouriteMutatorSchemaZero;
}) {
	const parsed = parse(addFavouriteMutatorSchemaZero, args);
	const membership = await getOrganizationMember({
		tx,
		args: {
			organizationId: parsed.metadata.organizationId,
			userId: ctx.userId
		}
	});
	if (membership.id !== parsed.metadata.memberId) {
		throw new Error('Member does not match the authenticated user');
	}
	await assertReferenceIsReadable({
		tx,
		ctx,
		organizationId: parsed.metadata.organizationId,
		reference: {
			referenceType: parsed.metadata.referenceType,
			referenceId: parsed.metadata.referenceId
		}
	});

	const [inserted] = await tx.dbTransaction.wrappedTransaction
		.insert(memberFavourite)
		.values({
			id: parsed.metadata.favouriteId,
			organizationId: parsed.metadata.organizationId,
			memberId: membership.id,
			referenceType: parsed.metadata.referenceType,
			referenceId: parsed.metadata.referenceId,
			createdAt: new Date()
		})
		.onConflictDoNothing()
		.returning();
	if (inserted) {
		return inserted;
	}

	const existing = await tx.dbTransaction.wrappedTransaction.query.memberFavourite.findFirst({
		where: and(
			eq(memberFavourite.memberId, membership.id),
			eq(memberFavourite.referenceType, parsed.metadata.referenceType),
			eq(memberFavourite.referenceId, parsed.metadata.referenceId)
		)
	});
	if (!existing) {
		throw new Error('Unable to add favourite');
	}
	return existing;
}

export async function removeFavourite({
	tx,
	ctx,
	args
}: {
	tx: ServerTransaction;
	ctx: QueryContext & { userId: string };
	args: RemoveFavouriteMutatorSchemaZero;
}) {
	const parsed = parse(removeFavouriteMutatorSchemaZero, args);
	const membership = await getOrganizationMember({
		tx,
		args: {
			organizationId: parsed.metadata.organizationId,
			userId: ctx.userId
		}
	});
	if (membership.id !== parsed.metadata.memberId) {
		throw new Error('Member does not match the authenticated user');
	}

	const [removed] = await tx.dbTransaction.wrappedTransaction
		.delete(memberFavourite)
		.where(
			and(
				eq(memberFavourite.organizationId, parsed.metadata.organizationId),
				eq(memberFavourite.memberId, membership.id),
				eq(memberFavourite.referenceType, parsed.metadata.referenceType),
				eq(memberFavourite.referenceId, parsed.metadata.referenceId)
			)
		)
		.returning();
	return removed ?? null;
}
