import type { MutatorParams } from '$lib/zero/schema';
import type { Transaction } from '$lib/server/db/zeroDrizzle';

import {
	type CreatePetitionZeroMutatorSchema,
	type UpdatePetitionZeroMutatorSchema,
	createPetitionZeroMutatorSchema,
	updatePetitionZeroMutatorSchema
} from '$lib/schema/petition/petition';
import { parse } from 'valibot';

import { organization, team, petition } from '$lib/schema/drizzle';
import { eq, and } from 'drizzle-orm';
import { petitionReadPermissions } from '$lib/zero/query/petition/permissions';
import { unsafeInsertActionCode } from './action_code';

export function createPetition(params: MutatorParams) {
	return async function (tx: Transaction, input: CreatePetitionZeroMutatorSchema) {
		const parsedInput = parse(createPetitionZeroMutatorSchema, input);
		const [organizationRecord] = await tx.dbTransaction.wrappedTransaction
			.select()
			.from(organization)
			.where(eq(organization.id, parsedInput.metadata.organizationId))
			.limit(1);
		if (!organizationRecord) {
			throw new Error('Organization not found');
		}

		if (
			![...params.queryContext.adminOrgs, ...params.queryContext.ownerOrgs].includes(
				organizationRecord.id
			) &&
			!parsedInput.metadata.teamId
		) {
			throw new Error('You are not authorized to create a petition in this organization');
		}

		if (parsedInput.metadata.teamId) {
			const [teamRecord] = await tx.dbTransaction.wrappedTransaction
				.select()
				.from(team)
				.where(eq(team.id, parsedInput.metadata.teamId))
				.limit(1);
			if (!teamRecord) {
				throw new Error('Team not found');
			}
			if (organizationRecord.id !== teamRecord.organizationId) {
				throw new Error('Team does not belong to organization');
			}
		}

		const petitionToCreate: typeof petition.$inferInsert = {
			...parsedInput.input,
			...(parsedInput.input.teamId ? { teamId: parsedInput.input.teamId } : {}),
			id: parsedInput.metadata.petitionId,
			organizationId: parsedInput.metadata.organizationId,
			published: false,
			createdAt: new Date(),
			updatedAt: new Date()
		};

		await unsafeInsertActionCode(tx, {
			organizationId: parsedInput.metadata.organizationId,
			type: 'petition_signed',
			referenceId: parsedInput.metadata.petitionId
		});

		async function getNextSlug(slug: string, count: number = 0): Promise<string> {
			const slugToCheck = `${slug}${count > 0 ? `-${count}` : ''}`;
			const result = await tx.query.petition
				.where('organizationId', '=', parsedInput.metadata.organizationId)
				.where('slug', '=', slugToCheck)
				.where('deletedAt', 'IS', null)
				.run({ type: 'complete' });
			if (result.length > 0) {
				return await getNextSlug(slug, count + 1);
			}
			return slugToCheck;
		}

		async function getNextTitle(title: string, count: number = 0): Promise<string> {
			const titleToCheck = `${title}${count > 0 ? ` ${count}` : ''}`;
			const result = await tx.query.petition
				.where('organizationId', '=', parsedInput.metadata.organizationId)
				.where('title', '=', titleToCheck)
				.where('deletedAt', 'IS', null)
				.run({ type: 'complete' });
			if (result.length > 0) {
				return await getNextTitle(title, count + 1);
			}
			return titleToCheck;
		}

		const uniqueSlug = await getNextSlug(petitionToCreate.slug);
		const uniqueTitle = await getNextTitle(petitionToCreate.title);

		petitionToCreate.slug = uniqueSlug;
		petitionToCreate.title = uniqueTitle;

		const [result] = await tx.dbTransaction.wrappedTransaction
			.insert(petition)
			.values(petitionToCreate)
			.returning();
		if (!result) {
			throw new Error('Unable to create petition');
		}

		params.result?.push(result);
	};
}

export function updatePetition(params: MutatorParams) {
	return async function (tx: Transaction, input: UpdatePetitionZeroMutatorSchema) {
		const parsed = parse(updatePetitionZeroMutatorSchema, input);
		const petitionRecord = await tx.query.petition
			.where('id', '=', parsed.metadata.petitionId)
			.where('organizationId', '=', parsed.metadata.organizationId)
			.where((expr) => petitionReadPermissions(expr, params.queryContext))
			.one()
			.run();
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
	};
}
