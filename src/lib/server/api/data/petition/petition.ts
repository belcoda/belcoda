import { petition } from '$lib/schema/drizzle';
import type { ServerTransaction } from '@rocicorp/zero';
import { type QueryContext, builder } from '$lib/zero/schema';

import {
	type CreatePetitionZeroMutatorSchema,
	type UpdatePetitionZeroMutatorSchema,
	createPetitionZeroMutatorSchema,
	updatePetitionZeroMutatorSchema
} from '$lib/schema/petition/petition';
import { parse } from 'valibot';

import { organizationReadPermissions } from '$lib/zero/query/organizations/permissions';
import { team } from '$lib/schema/drizzle';
import { and, eq } from 'drizzle-orm';
import { _insertActionCodeUnsafe } from '../action/insert';
import { petitionReadPermissions } from '$lib/zero/query/petition/permissions';
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
		!parsed.metadata.teamId
	) {
		throw new Error('You are not authorized to create a petition in this organization');
	}

	if (parsed.metadata.teamId) {
		const [teamRecord] = await tx.dbTransaction.wrappedTransaction
			.select()
			.from(team)
			.where(eq(team.id, parsed.metadata.teamId))
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
		const result = await tx.run(
			builder.petition
				.where('organizationId', '=', parsed.metadata.organizationId)
				.where('slug', '=', slugToCheck)
				.where('deletedAt', 'IS', null)
		);
		if (result.length > 0) {
			return await getNextSlug(slug, count + 1);
		}
		return slugToCheck;
	}

	async function getNextTitle(title: string, count: number = 0): Promise<string> {
		const titleToCheck = `${title}${count > 0 ? ` ${count}` : ''}`;
		const result = await tx.run(
			builder.petition
				.where('organizationId', '=', parsed.metadata.organizationId)
				.where('title', '=', titleToCheck)
				.where('deletedAt', 'IS', null)
		);
		if (result.length > 0) {
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

	await tx.dbTransaction.wrappedTransaction
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
		);
}
