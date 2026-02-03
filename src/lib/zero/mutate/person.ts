import { type Transaction } from '@rocicorp/zero';
import { type Schema } from '$lib/zero/schema';

import {
	type CreateMutatorSchemaZeroOutput,
	type UpdateMutatorSchemaZeroOutput,
	type DeleteMutatorSchemaZero,
	type AddPersonToTeamMutatorSchemaZero,
	type RemovePersonFromTeamMutatorSchemaZero,
	type AddPersonTagMutatorSchemaZero,
	type RemovePersonTagMutatorSchemaZero
} from '$lib/schema/person';

export function createPerson() {
	return async function (tx: Transaction<Schema>, args: CreateMutatorSchemaZeroOutput) {
		tx.mutate.person.insert({
			id: args.metadata.personId,
			organizationId: args.metadata.organizationId,
			addedFrom: args.metadata.addedFrom,
			country: args.input.country,
			preferredLanguage: args.input.preferredLanguage,
			subscribed: args.input.subscribed,
			doNotContact: args.input.doNotContact,
			socialMedia: args.input.socialMedia,
			mostRecentActivityAt: new Date().getTime(),
			createdAt: new Date().getTime(),
			updatedAt: new Date().getTime()
		});
	};
}

export function updatePerson() {
	return async function (tx: Transaction<Schema>, args: UpdateMutatorSchemaZeroOutput) {
		tx.mutate.person.update({
			id: args.metadata.personId,
			...args.input,
			dateOfBirth: args.input.dateOfBirth ? args.input.dateOfBirth : undefined,
			updatedAt: new Date().getTime()
		});
	};
}
export function deletePerson() {
	return async function (tx: Transaction<Schema>, args: DeleteMutatorSchemaZero) {
		tx.mutate.person.update({
			id: args.metadata.personId,
			deletedAt: new Date().getTime()
		});
	};
}

export function addPersonToTeam() {
	return async function (tx: Transaction<Schema>, args: AddPersonToTeamMutatorSchemaZero) {
		tx.mutate.personTeam.insert({
			organizationId: args.metadata.organizationId,
			personId: args.metadata.personId,
			teamId: args.metadata.teamId,
			createdAt: new Date().getTime()
		});
	};
}

export function removePersonFromTeam() {
	return async function (tx: Transaction<Schema>, args: RemovePersonFromTeamMutatorSchemaZero) {
		tx.mutate.personTeam.delete({
			personId: args.metadata.personId,
			teamId: args.metadata.teamId
		});
	};
}

export function addPersonTag() {
	return async function (tx: Transaction<Schema>, args: AddPersonTagMutatorSchemaZero) {
		tx.mutate.personTag.insert({
			organizationId: args.metadata.organizationId,
			personId: args.metadata.personId,
			tagId: args.metadata.tagId,
			createdAt: new Date().getTime()
		});
	};
}

export function removePersonTag() {
	return async function (tx: Transaction<Schema>, args: RemovePersonTagMutatorSchemaZero) {
		tx.mutate.personTag.delete({
			personId: args.metadata.personId,
			tagId: args.metadata.tagId
		});
	};
}
