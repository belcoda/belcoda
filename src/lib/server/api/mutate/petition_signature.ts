import type { Transaction } from '$lib/server/db/zeroDrizzle';
import { type MutatorParams } from '$lib/zero/schema';

import {
	type CreateMutatorSchemaOutput,
	type UpdateMutatorSchemaOutput
} from '$lib/schema/petition/petition-signature';
import { getQueue } from '$lib/server/queue';

import { organizationReadPermissions } from '$lib/zero/query/organizations/permissions';
import { personReadPermissions } from '$lib/zero/query/person/permissions';
import { petitionReadPermissions } from '$lib/zero/query/petition/permissions';
import { petitionSignatureReadPermissions } from '$lib/zero/query/petition_signature/permissions';
import { petitionSignature } from '$lib/schema/drizzle';
import { eq, and } from 'drizzle-orm';

export function createPetitionSignature(params: MutatorParams) {
	return async function (tx: Transaction, args: CreateMutatorSchemaOutput) {
		const organization = await tx.query.organization
			.where((expr) => organizationReadPermissions(expr, params.queryContext))
			.where('id', args.metadata.organizationId)
			.one()
			.run();
		if (!organization) {
			throw new Error('Organization not found');
		}
		const person = await tx.query.person
			.where((expr) => personReadPermissions(expr, params.queryContext))
			.where('id', args.metadata.personId)
			.one()
			.run();
		if (!person) {
			throw new Error('Person not found');
		}
		const petition = await tx.query.petition
			.where((expr) => petitionReadPermissions(expr, params.queryContext))
			.where('id', args.metadata.petitionId)
			.one()
			.run();
		if (!petition) {
			throw new Error('Petition not found');
		}

		tx.mutate.petitionSignature.insert({
			id: args.metadata.petitionSignatureId,
			organizationId: args.metadata.organizationId,
			petitionId: args.metadata.petitionId,
			personId: args.metadata.personId,
			teamId: petition.teamId,
			details: args.input.details,
			responses: args.input.responses,
			createdAt: new Date().getTime(),
			updatedAt: new Date().getTime()
		});

		const queue = await getQueue();
		params.asyncTasks.push(async () => {
			await queue.insertActivity({
				organizationId: args.metadata.organizationId,
				personId: args.metadata.personId,
				userId: params.queryContext.userId || undefined,
				type: 'petition_signed',
				referenceId: args.metadata.petitionSignatureId,
				unread: false
			});
		});
	};
}

export function updatePetitionSignature(params: MutatorParams) {
	return async function (tx: Transaction, args: UpdateMutatorSchemaOutput) {
		const petitionSignatureRecord = await tx.query.petitionSignature
			.where('id', args.metadata.petitionSignatureId)
			.where('organizationId', args.metadata.organizationId)
			.where((expr) => petitionSignatureReadPermissions(expr, params.queryContext))
			.one()
			.run();
		if (!petitionSignatureRecord) {
			throw new Error('Petition signature not found');
		}
		const [result] = await tx.dbTransaction.wrappedTransaction
			.update(petitionSignature)
			.set({
				responses: args.input.responses,
				updatedAt: new Date()
			})
			.where(
				and(
					eq(petitionSignature.id, args.metadata.petitionSignatureId),
					eq(petitionSignature.organizationId, args.metadata.organizationId)
				)
			)
			.returning();
		if (!result) {
			throw new Error('Unable to update petition signature');
		}
		params.result?.push(result);
	};
}
