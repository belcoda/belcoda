import type { ServerTransaction } from '@rocicorp/zero';
import type { QueryContext } from '$lib/zero/schema';
import { whatsappAccount } from '$lib/schema/drizzle';
import { and, eq, isNull } from 'drizzle-orm';
import { parse } from 'valibot';

import {
	type CreateWhatsappAccountMutatorSchemaOutput,
	type DeleteWhatsappAccountMutatorSchema,
	type UnlinkWhatsappAccountMutatorSchema,
	type UpdateWhatsappAccountMetadataMutatorSchemaOutput,
	createWhatsappAccountMutatorSchema,
	deleteWhatsappAccountMutatorSchema,
	unlinkWhatsappAccountMutatorSchema,
	updateWhatsappAccountMetadataMutatorSchema
} from '$lib/schema/whatsapp-account';
import {
	completeInferredMemberOnboardingStepForOrganizationInTransaction,
	completeInferredMemberOnboardingStepForUserInTransaction
} from '$lib/server/api/data/organization/member';

type WhatsappAccountRecord = typeof whatsappAccount.$inferSelect;

/**
 * Enforces the mutate (create/update/delete) authorization rules for a given
 * scope + referenceId pair.
 *
 * - organization scope: only admins and owners of that organization may mutate.
 * - user scope: only the owning user may mutate, regardless of any role they
 *   hold in any organization.
 */
function assertCanMutate(
	ctx: QueryContext,
	{ scope, referenceId }: Pick<WhatsappAccountRecord, 'scope' | 'referenceId'>
) {
	if (scope === 'organization') {
		if (![...ctx.adminOrgs, ...ctx.ownerOrgs].includes(referenceId)) {
			throw new Error('You are not authorized to mutate this organization WhatsApp account');
		}
		return;
	}
	// scope === 'user'
	if (!ctx.userId || ctx.userId !== referenceId) {
		throw new Error('You are not authorized to mutate this user WhatsApp account');
	}
}

async function getWhatsappAccountById(
	tx: ServerTransaction,
	whatsappAccountId: string
): Promise<WhatsappAccountRecord | undefined> {
	const [record] = await tx.dbTransaction.wrappedTransaction
		.select()
		.from(whatsappAccount)
		.where(eq(whatsappAccount.id, whatsappAccountId))
		.limit(1);
	return record;
}

export async function createWhatsappAccount({
	tx,
	ctx,
	args
}: {
	tx: ServerTransaction;
	ctx: QueryContext;
	args: CreateWhatsappAccountMutatorSchemaOutput;
}) {
	const parsed = parse(createWhatsappAccountMutatorSchema, args);

	// authorize based on the requested scope + referenceId
	assertCanMutate(ctx, {
		scope: parsed.input.scope,
		referenceId: parsed.input.referenceId
	});

	// identifier (phone number / whatsapp username) is unique among *active* accounts.
	// Soft-deleted (unlinked) rows keep their identifier, so they must be excluded here
	// and by the DB's partial unique index — otherwise an unlinked account could never
	// be re-linked.
	const [existing] = await tx.dbTransaction.wrappedTransaction
		.select()
		.from(whatsappAccount)
		.where(
			and(
				eq(whatsappAccount.identifier, parsed.input.identifier),
				isNull(whatsappAccount.deletedAt)
			)
		)
		.limit(1);
	if (existing) {
		throw new Error('A WhatsApp account with this identifier already exists');
	}

	const now = new Date();
	const accountToCreate: typeof whatsappAccount.$inferInsert = {
		id: parsed.metadata.whatsappAccountId,
		referenceId: parsed.input.referenceId,
		scope: parsed.input.scope,
		identifier: parsed.input.identifier,
		details: parsed.input.details,
		metadata: parsed.input.metadata,
		createdAt: now,
		updatedAt: now,
		deletedAt: null
	};

	const [result] = await tx.dbTransaction.wrappedTransaction
		.insert(whatsappAccount)
		.values(accountToCreate)
		.returning();
	if (!result) {
		throw new Error('Unable to create WhatsApp account');
	}
	if (result.scope === 'organization') {
		await completeInferredMemberOnboardingStepForOrganizationInTransaction({
			tx,
			organizationId: result.referenceId,
			step: 'whatsappAccount'
		});
	} else if (ctx.userId) {
		await completeInferredMemberOnboardingStepForUserInTransaction({
			tx,
			userId: ctx.userId,
			step: 'whatsappAccount'
		});
	}
	return result;
}

/**
 * Removes a WhatsApp account. This is a soft delete: the row is retained and its
 * `deletedAt` column is stamped so historical references remain intact.
 */
export async function deleteWhatsappAccount({
	tx,
	ctx,
	args
}: {
	tx: ServerTransaction;
	ctx: QueryContext;
	args: DeleteWhatsappAccountMutatorSchema;
}) {
	const parsed = parse(deleteWhatsappAccountMutatorSchema, args);

	const record = await getWhatsappAccountById(tx, parsed.metadata.whatsappAccountId);
	if (!record) {
		throw new Error('WhatsApp account not found');
	}

	assertCanMutate(ctx, record);

	const now = new Date();
	await tx.dbTransaction.wrappedTransaction
		.update(whatsappAccount)
		.set({ deletedAt: now, updatedAt: now })
		.where(
			and(
				eq(whatsappAccount.id, parsed.metadata.whatsappAccountId),
				isNull(whatsappAccount.deletedAt)
			)
		);
}

/**
 * Unlinks a WhatsApp account. Like {@link deleteWhatsappAccount} this is a soft
 * delete (stamps `deletedAt`), but it is a distinct operation because unlinking
 * should eventually also detach the account at the WhatsApp provider.
 */
export async function unlinkWhatsappAccount({
	tx,
	ctx,
	args
}: {
	tx: ServerTransaction;
	ctx: QueryContext;
	args: UnlinkWhatsappAccountMutatorSchema;
}) {
	const parsed = parse(unlinkWhatsappAccountMutatorSchema, args);

	const record = await getWhatsappAccountById(tx, parsed.metadata.whatsappAccountId);
	if (!record) {
		throw new Error('WhatsApp account not found');
	}

	assertCanMutate(ctx, record);

	// todo: unlink with API
	const now = new Date();
	await tx.dbTransaction.wrappedTransaction
		.update(whatsappAccount)
		.set({ deletedAt: now, updatedAt: now })
		.where(
			and(
				eq(whatsappAccount.id, parsed.metadata.whatsappAccountId),
				isNull(whatsappAccount.deletedAt)
			)
		);
}

export async function updateWhatsappAccountMetadata({
	tx,
	ctx,
	args
}: {
	tx: ServerTransaction;
	ctx: QueryContext;
	args: UpdateWhatsappAccountMetadataMutatorSchemaOutput;
}) {
	const parsed = parse(updateWhatsappAccountMetadataMutatorSchema, args);

	const record = await getWhatsappAccountById(tx, parsed.metadata.whatsappAccountId);
	if (!record || record.deletedAt !== null) {
		throw new Error('WhatsApp account not found');
	}

	assertCanMutate(ctx, record);

	const [result] = await tx.dbTransaction.wrappedTransaction
		.update(whatsappAccount)
		.set({
			metadata: parsed.input.metadata,
			updatedAt: new Date()
		})
		.where(
			and(
				eq(whatsappAccount.id, parsed.metadata.whatsappAccountId),
				isNull(whatsappAccount.deletedAt)
			)
		)
		.returning();
	if (!result) {
		throw new Error('Unable to update WhatsApp account');
	}
	return result;
}
