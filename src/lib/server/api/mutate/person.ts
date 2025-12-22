import type { MutatorParams } from '$lib/zero/schema';
import type { Transaction } from '$lib/server/db/zeroDrizzle';

import {
	type CreateMutatorSchemaZeroOutput,
	type UpdateMutatorSchemaZeroOutput,
	updatePersonZero,
	type DeleteMutatorSchemaZero,
	type AddPersonToTeamMutatorSchemaZero,
	type RemovePersonFromTeamMutatorSchemaZero,
	type AddPersonTagMutatorSchemaZero,
	type RemovePersonTagMutatorSchemaZero
} from '$lib/schema/person';
import { parse } from 'valibot';

import { person, organization, team, personTeam, personTag } from '$lib/schema/drizzle';
import { eq, and } from 'drizzle-orm';
import { personReadPermissions } from '$lib/zero/query/person/permissions';
import { teamReadPermissions } from '$lib/zero/query/team/permissions';
import { tagReadPermissions } from '$lib/zero/query/tag/permissions';

export function createPerson(params: MutatorParams) {
	return async function (tx: Transaction, input: CreateMutatorSchemaZeroOutput) {
		const [organizationRecord] = await tx.dbTransaction.wrappedTransaction
			.select()
			.from(organization)
			.where(eq(organization.id, input.metadata.organizationId))
			.limit(1);
		if (!organizationRecord) {
			throw new Error('Organization not found');
		}

		if (
			![...params.queryContext.adminOrgs, ...params.queryContext.ownerOrgs].includes(
				organizationRecord.id
			) &&
			!input.metadata.teamId
		) {
			throw new Error('You are not authorized to create a person in this organization');
		}

		if (input.metadata.teamId) {
			const [teamRecord] = await tx.dbTransaction.wrappedTransaction
				.select()
				.from(team)
				.where(eq(team.id, input.metadata.teamId))
				.limit(1);
			if (!teamRecord) {
				throw new Error('Team not found');
			}
			if (organizationRecord.id !== teamRecord.organizationId) {
				throw new Error('Team does not belong to organization');
			}
		}

		const personToImport: typeof person.$inferInsert = {
			...input.input,
			dateOfBirth: input.input.dateOfBirth ? new Date(input.input.dateOfBirth) : null,
			id: input.metadata.personId,
			organizationId: input.metadata.organizationId,
			addedFrom: input.metadata.addedFrom,
			mostRecentActivityAt: new Date(),
			createdAt: new Date(),
			updatedAt: new Date()
		};

		const [result] = await tx.dbTransaction.wrappedTransaction
			.insert(person)
			.values(personToImport)
			.returning();
		if (!result) {
			throw new Error('Unable to create person');
		}

		//TODO: add teamId if provided
		if (input.metadata.teamId) {
			await tx.dbTransaction.wrappedTransaction.insert(personTeam).values({
				personId: result.id,
				teamId: input.metadata.teamId,
				organizationId: input.metadata.organizationId,
				createdAt: new Date()
			});
		}

		params.result?.push(result);
	};
}

export function updatePerson(params: MutatorParams) {
	return async function (tx: Transaction, input: UpdateMutatorSchemaZeroOutput) {
		const personRecord = await tx.query.person
			.where('id', '=', input.metadata.personId)
			.where('organizationId', '=', input.metadata.organizationId)
			.where((expr) => personReadPermissions(expr, params.queryContext))
			.one()
			.run();
		if (!personRecord) {
			throw new Error('Person not found');
		}

		const parseUpdateParams = parse(updatePersonZero, input.input);

		await tx.dbTransaction.wrappedTransaction
			.update(person)
			.set({
				...parseUpdateParams,
				updatedAt: new Date()
			})
			.where(
				and(
					eq(person.id, input.metadata.personId),
					eq(person.organizationId, input.metadata.organizationId)
				)
			);
	};
}

export function deletePerson(params: MutatorParams) {
	return async function (tx: Transaction, input: DeleteMutatorSchemaZero) {
		const personRecord = await tx.query.person
			.where('id', '=', input.metadata.personId)
			.where('organizationId', '=', input.metadata.organizationId)
			.where((expr) => personReadPermissions(expr, params.queryContext))
			//special admin permissions required
			.where((expr) =>
				expr.or(
					expr.cmp('organizationId', 'IN', params.queryContext.adminOrgs),
					expr.cmp('organizationId', 'IN', params.queryContext.ownerOrgs)
				)
			)
			.where('deletedAt', 'IS', null)
			.one()
			.run();
		if (!personRecord) {
			throw new Error('Person not found');
		}

		await tx.dbTransaction.wrappedTransaction
			.update(person)
			.set({
				deletedAt: new Date()
			})
			.where(
				and(
					eq(person.id, input.metadata.personId),
					eq(person.organizationId, input.metadata.organizationId)
				)
			);
	};
}

export function addPersonToTeam(params: MutatorParams) {
	return async function (tx: Transaction, input: AddPersonToTeamMutatorSchemaZero) {
		// make sure we have permissions for the person
		const personRecord = await tx.query.person
			.where('id', '=', input.metadata.personId)
			.where('organizationId', '=', input.metadata.organizationId)
			.where((expr) => personReadPermissions(expr, params.queryContext))
			.one()
			.run();
		if (!personRecord) {
			throw new Error('Person not found');
		}

		// make sure we have permissions for the team
		const teamRecord = await tx.query.team
			.where('id', '=', input.metadata.teamId)
			.where('organizationId', '=', input.metadata.organizationId)
			.where((expr) => teamReadPermissions(expr, params.queryContext))
			.one()
			.run();
		if (!teamRecord) {
			throw new Error('Team not found');
		}

		await tx.dbTransaction.wrappedTransaction.insert(personTeam).values({
			personId: input.metadata.personId,
			teamId: input.metadata.teamId,
			organizationId: input.metadata.organizationId,
			createdAt: new Date()
		});
	};
}

export function removePersonFromTeam(params: MutatorParams) {
	return async function (tx: Transaction, input: RemovePersonFromTeamMutatorSchemaZero) {
		//gotta be an admin or owner of the organization
		if (
			!params.queryContext.adminOrgs.includes(input.metadata.organizationId) &&
			!params.queryContext.ownerOrgs.includes(input.metadata.organizationId)
		) {
			throw new Error('You are not authorized to remove a person from a team in this organization');
		}

		await tx.dbTransaction.wrappedTransaction.delete(personTeam).where(
			and(
				eq(personTeam.personId, input.metadata.personId),
				eq(personTeam.teamId, input.metadata.teamId),
				eq(personTeam.organizationId, input.metadata.organizationId) // make sure the team and person belongs to the organization
			)
		);
	};
}

export function addPersonTag(params: MutatorParams) {
	return async function (tx: Transaction, input: AddPersonTagMutatorSchemaZero) {
		//make sure we have permissions for the person
		const personRecord = await tx.query.person
			.where('id', '=', input.metadata.personId)
			.where('organizationId', '=', input.metadata.organizationId)
			.where((expr) => personReadPermissions(expr, params.queryContext))
			.one()
			.run();
		if (!personRecord) {
			throw new Error('Person not found');
		}

		//make sure we have permissions for the tag
		const tagRecord = await tx.query.tag
			.where('id', '=', input.metadata.tagId)
			.where('organizationId', '=', input.metadata.organizationId)
			.where((expr) => tagReadPermissions(expr, params.queryContext))
			.one()
			.run();
		if (!tagRecord) {
			throw new Error('Tag not found');
		}

		await tx.dbTransaction.wrappedTransaction.insert(personTag).values({
			personId: input.metadata.personId,
			tagId: input.metadata.tagId,
			organizationId: input.metadata.organizationId,
			createdAt: new Date()
		});
	};
}

export function removePersonTag(params: MutatorParams) {
	return async function (tx: Transaction, input: RemovePersonTagMutatorSchemaZero) {
		//gotta be an admin or owner of the organization
		if (
			!params.queryContext.adminOrgs.includes(input.metadata.organizationId) &&
			!params.queryContext.ownerOrgs.includes(input.metadata.organizationId)
		) {
			throw new Error('You are not authorized to remove a person from a tag in this organization');
		}

		await tx.dbTransaction.wrappedTransaction.delete(personTag).where(
			and(
				eq(personTag.personId, input.metadata.personId),
				eq(personTag.tagId, input.metadata.tagId),
				eq(personTag.organizationId, input.metadata.organizationId) // make sure the tag and person belongs to the organization
			)
		);
	};
}
