import type { ServerTransaction } from '@rocicorp/zero';
import { and, eq } from 'drizzle-orm';
import { parse } from 'valibot';

import {
	addFavouriteMutatorSchemaZero,
	type AddFavouriteMutatorSchemaZero,
	removeFavouriteMutatorSchemaZero,
	type RemoveFavouriteMutatorSchemaZero
} from '$lib/schema/favourite';
import { memberFavourite } from '$lib/schema/drizzle';
import { getOrganizationMember } from '$lib/server/api/data/organization/member';
import type { QueryContext } from '$lib/zero/schema';
import { isFavouriteReferenceReadable } from './reference-permissions';

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
	const referenceIsReadable = await isFavouriteReferenceReadable({
		tx,
		ctx,
		organizationId: parsed.metadata.organizationId,
		reference: {
			referenceType: parsed.metadata.referenceType,
			referenceId: parsed.metadata.referenceId
		}
	});
	if (!referenceIsReadable) {
		throw new Error('Favourite reference not found');
	}

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
