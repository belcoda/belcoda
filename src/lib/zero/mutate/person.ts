import { type Transaction } from '@rocicorp/zero';
import { type Schema } from '$lib/zero/schema';
import { defineMutator } from '@rocicorp/zero';

import {
	createMutatorSchemaZero,
	updateMutatorSchemaZero,
	deleteMutatorSchemaZero,
	addPersonToTeamMutatorSchemaZero,
	removePersonFromTeamMutatorSchemaZero,
	addPersonTagMutatorSchemaZero,
	removePersonTagMutatorSchemaZero
} from '$lib/schema/person';

export const createPerson = defineMutator(createMutatorSchemaZero, async ({ tx, args, ctx }) => {
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
});

export const updatePerson = defineMutator(updateMutatorSchemaZero, async ({ tx, args, ctx }) => {
	tx.mutate.person.update({
		id: args.metadata.personId,
		...args.input,
		dateOfBirth: args.input.dateOfBirth ? args.input.dateOfBirth : undefined,
		updatedAt: new Date().getTime()
	});
});
export const deletePerson = defineMutator(deleteMutatorSchemaZero, async ({ tx, args, ctx }) => {
	tx.mutate.person.update({
		id: args.metadata.personId,
		deletedAt: new Date().getTime()
	});
});

export const addPersonToTeam = defineMutator(
	addPersonToTeamMutatorSchemaZero,
	async ({ tx, args, ctx }) => {
		tx.mutate.personTeam.insert({
			organizationId: args.metadata.organizationId,
			personId: args.metadata.personId,
			teamId: args.metadata.teamId,
			createdAt: new Date().getTime()
		});
	}
);

export const removePersonFromTeam = defineMutator(
	removePersonFromTeamMutatorSchemaZero,
	async ({ tx, args, ctx }) => {
		tx.mutate.personTeam.delete({
			personId: args.metadata.personId,
			teamId: args.metadata.teamId
		});
	}
);

export const addPersonTag = defineMutator(
	addPersonTagMutatorSchemaZero,
	async ({ tx, args, ctx }) => {
		tx.mutate.personTag.insert({
			organizationId: args.metadata.organizationId,
			personId: args.metadata.personId,
			tagId: args.metadata.tagId,
			createdAt: new Date().getTime()
		});
	}
);

export const removePersonTag = defineMutator(
	removePersonTagMutatorSchemaZero,
	async ({ tx, args, ctx }) => {
		tx.mutate.personTag.delete({
			personId: args.metadata.personId,
			tagId: args.metadata.tagId
		});
	}
);
