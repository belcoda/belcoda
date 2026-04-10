import { petition } from '$lib/schema/drizzle';
import type { ServerTransaction } from '@rocicorp/zero';
import { type QueryContext, builder } from '$lib/zero/schema';

import {
	type CreatePetitionZeroMutatorSchema,
	type UpdatePetitionZeroMutatorSchema,
	type ArchivePetitionMutatorSchema,
	createPetitionZeroMutatorSchema,
	updatePetitionZeroMutatorSchema,
	archivePetitionMutatorSchema,
	type DeletePetitionMutatorSchema,
	deletePetitionMutatorSchema
} from '$lib/schema/petition/petition';
import { parse } from 'valibot';
import { organizationReadPermissions } from '$lib/zero/query/organizations/permissions';
import { team } from '$lib/schema/drizzle';
import { and, eq, isNull } from 'drizzle-orm';
import { _insertActionCodeUnsafe } from '../action/insert';
import { petitionReadPermissions } from '$lib/zero/query/petition/permissions';
import { getQueue } from '$lib/server/queue';
import pino from '$lib/pino';
const log = pino(import.meta.url);

export async function createPetition({
	tx,
	ctx,
	args
}: {
	tx: ServerTransaction;
	ctx: QueryContext;
	args: CreatePetitionZeroMutatorSchema;
}) {
	const parsed = parse(createPetitionZeroMutatorSchema, args);
	const organizationRecord = await tx.run(
		builder.organization
			.where((expr) => organizationReadPermissions(expr, ctx))
			.where('id', parsed.metadata.organizationId)
			.one()
	);
	if (!organizationRecord) {
		throw new Error('Organization not found');
	}
	if (
		![...ctx.adminOrgs, ...ctx.ownerOrgs].includes(organizationRecord.id) &&
		!parsed.input.teamId
	) {
		throw new Error('You are not authorized to create a petition in this organization');
	}

	if (parsed.input.teamId) {
		const [teamRecord] = await tx.dbTransaction.wrappedTransaction
			.select()
			.from(team)
			.where(eq(team.id, parsed.input.teamId))
			.limit(1);
		if (!teamRecord) {
			throw new Error('Team not found');
		}
		if (organizationRecord.id !== teamRecord.organizationId) {
			throw new Error('Team does not belong to organization');
		}
	}

	await _insertActionCodeUnsafe({
		tx,
		args: {
			organizationId: parsed.metadata.organizationId,
			type: 'petition_signed',
			referenceId: parsed.metadata.petitionId
		}
	});
	async function getNextSlug(slug: string, count: number = 0): Promise<string> {
		const slugToCheck = `${slug}${count > 0 ? `-${count}` : ''}`;
		const result = await tx.dbTransaction.wrappedTransaction.query.petition.findFirst({
			where: and(
				eq(petition.organizationId, parsed.metadata.organizationId),
				eq(petition.slug, slugToCheck),
				isNull(petition.deletedAt)
			)
		});
		if (result) {
			return await getNextSlug(slug, count + 1);
		}
		return slugToCheck;
	}

	async function getNextTitle(title: string, count: number = 0): Promise<string> {
		const titleToCheck = `${title}${count > 0 ? ` ${count}` : ''}`;
		const result = await tx.dbTransaction.wrappedTransaction.query.petition.findFirst({
			where: and(
				eq(petition.organizationId, parsed.metadata.organizationId),
				eq(petition.title, titleToCheck),
				isNull(petition.deletedAt)
			)
		});
		if (result) {
			return await getNextTitle(title, count + 1);
		}
		return titleToCheck;
	}

	const uniqueSlug = await getNextSlug(parsed.input.slug);
	const uniqueTitle = await getNextTitle(parsed.input.title);

	const petitionToCreate: typeof petition.$inferInsert = {
		...parsed.input,
		...(parsed.input.teamId ? { teamId: parsed.input.teamId } : {}),
		id: parsed.metadata.petitionId,
		organizationId: parsed.metadata.organizationId,
		slug: uniqueSlug,
		title: uniqueTitle,
		published: false,
		createdAt: new Date(),
		updatedAt: new Date()
	};
	petitionToCreate.slug = uniqueSlug;
	petitionToCreate.title = uniqueTitle;

	const [result] = await tx.dbTransaction.wrappedTransaction
		.insert(petition)
		.values(petitionToCreate)
		.returning();
	if (!result) {
		throw new Error('Unable to create petition');
	}
	return result;
}

export async function updatePetition({
	tx,
	ctx,
	args
}: {
	tx: ServerTransaction;
	ctx: QueryContext;
	args: UpdatePetitionZeroMutatorSchema;
}) {
	const parsed = parse(updatePetitionZeroMutatorSchema, args);
	const petitionRecord = await tx.run(
		builder.petition
			.where('id', '=', parsed.metadata.petitionId)
			.where('organizationId', '=', parsed.metadata.organizationId)
			.where((expr) => petitionReadPermissions(expr, ctx))
			.one()
	);
	if (!petitionRecord) {
		throw new Error('Petition not found');
	}

	const [updatedPetition] = await tx.dbTransaction.wrappedTransaction
		.update(petition)
		.set({
			...parsed.input,
			updatedAt: new Date()
		})
		.where(
			and(
				eq(petition.id, parsed.metadata.petitionId),
				eq(petition.organizationId, parsed.metadata.organizationId)
			)
		)
		.returning();
	if (!updatedPetition) {
		throw new Error('Unable to update petition: Petition not found');
	}

	const structureChanged =
		petitionRecord.title !== updatedPetition.title ||
		JSON.stringify(petitionRecord.settings) !== JSON.stringify(updatedPetition.settings);
	const publishedStatusChanged = petitionRecord.published !== updatedPetition.published;

	if (updatedPetition?.published && (structureChanged || publishedStatusChanged)) {
		try {
			const queue = await getQueue();
			await queue.deployPetitionWhatsAppFlow({ petitionId: parsed.metadata.petitionId });
		} catch (error) {
			log.error(
				{ error, petitionId: parsed.metadata.petitionId },
				'Error deploying petition WhatsApp flow'
			);
		}
	}
}

export async function archivePetition({
	tx,
	ctx,
	args
}: {
	tx: ServerTransaction;
	ctx: QueryContext;
	args: ArchivePetitionMutatorSchema;
}) {
	const parsed = parse(archivePetitionMutatorSchema, args);
	const petitionRecord = await tx.run(
		builder.petition
			.where('id', '=', parsed.metadata.petitionId)
			.where('organizationId', '=', parsed.metadata.organizationId)
			.where((expr) => petitionReadPermissions(expr, ctx))
			.one()
	);
	if (!petitionRecord) {
		throw new Error('Petition not found');
	}

	await tx.dbTransaction.wrappedTransaction
		.update(petition)
		.set({
			archivedAt: new Date(),
			updatedAt: new Date()
		})
		.where(
			and(
				eq(petition.id, parsed.metadata.petitionId),
				eq(petition.organizationId, parsed.metadata.organizationId)
			)
		);
}

export async function deletePetition({
	tx,
	ctx,
	args
}: {
	tx: ServerTransaction;
	ctx: QueryContext;
	args: DeletePetitionMutatorSchema;
}) {
	const parsed = parse(deletePetitionMutatorSchema, args);
	const petitionRecord = await tx.run(
		builder.petition
			.where('id', '=', parsed.metadata.petitionId)
			.where('organizationId', '=', parsed.metadata.organizationId)
			.where((expr) => petitionReadPermissions(expr, ctx))
			.one()
	);
	if (!petitionRecord) {
		throw new Error('Petition not found');
	}

	await tx.dbTransaction.wrappedTransaction
		.update(petition)
		.set({
			deletedAt: new Date(),
			updatedAt: new Date()
		})
		.where(
			and(
				eq(petition.id, parsed.metadata.petitionId),
				eq(petition.organizationId, parsed.metadata.organizationId)
			)
		);
}

export async function getPetitionById({
	petitionId,
	ctx,
	tx
}: {
	petitionId: string;
	ctx: QueryContext;
	tx: ServerTransaction;
}) {
	const petitionRecord = await tx.run(
		builder.petition
			.where('id', '=', petitionId)
			.where((expr) => petitionReadPermissions(expr, ctx))
			.one()
	);
	if (!petitionRecord) {
		throw new Error('Petition not found');
	}
	return petitionRecord;
}

/**
 * Loads a petition by id without tenant or auth filters. For trusted server
 * callsites only; do not call from public or untrusted request handlers.
 */
export async function _getPetitionByIdUnsafeNoTenantCheck({
	petitionId,
	tx
}: {
	petitionId: string;
	tx: ServerTransaction;
}) {
	const petitionRecord = await tx.dbTransaction.wrappedTransaction.query.petition.findFirst({
		where: and(eq(petition.id, petitionId), isNull(petition.deletedAt))
	});
	if (!petitionRecord) {
		return null;
	}
	return petitionRecord;
}
