import { defineMutator } from '@rocicorp/zero';

import {
	updatePersonZero,
	createMutatorSchemaZero,
	deleteMutatorSchemaZero,
	addPersonToTeamMutatorSchemaZero,
	removePersonFromTeamMutatorSchemaZero,
	addPersonTagMutatorSchemaZero,
	removePersonTagMutatorSchemaZero,
	updateMutatorSchemaZero
} from '$lib/schema/person';

import * as personDataFunctions from '$lib/server/api/data/person/person';
import * as personTeamDataFunctions from '$lib/server/api/data/person/team';
import * as personTagDataFunctions from '$lib/server/api/data/person/tag';

export const createPerson = defineMutator(createMutatorSchemaZero, async ({ tx, args, ctx }) => {
	if (tx.location !== 'server') {
		throw new Error('createPerson can only be called from the server');
	}
	await personDataFunctions.createPerson({ tx, ctx, args });
});

export const updatePerson = defineMutator(updateMutatorSchemaZero, async ({ tx, args, ctx }) => {
	if (tx.location !== 'server') {
		throw new Error('updatePerson can only be called from the server');
	}
	await personDataFunctions.updatePerson({ tx, ctx, args });
});
export const deletePerson = defineMutator(deleteMutatorSchemaZero, async ({ tx, args, ctx }) => {
	if (tx.location !== 'server') {
		throw new Error('deletePerson can only be called from the server');
	}
	await personDataFunctions.deletePerson({ tx, ctx, args });
});

export const addPersonToTeam = defineMutator(
	addPersonToTeamMutatorSchemaZero,
	async ({ tx, args, ctx }) => {
		if (tx.location !== 'server') {
			throw new Error('addPersonToTeam can only be called from the server');
		}
		await personTeamDataFunctions.addPersonToTeam({ tx, ctx, args });
	}
);

export const removePersonFromTeam = defineMutator(
	removePersonFromTeamMutatorSchemaZero,
	async ({ tx, args, ctx }) => {
		if (tx.location !== 'server') {
			throw new Error('removePersonFromTeam can only be called from the server');
		}
		await personTeamDataFunctions.removePersonFromTeam({ tx, ctx, args });
	}
);

export const addPersonTag = defineMutator(
	addPersonTagMutatorSchemaZero,
	async ({ tx, args, ctx }) => {
		if (tx.location !== 'server') {
			throw new Error('addPersonTag can only be called from the server');
		}
		await personTagDataFunctions.addPersonTag({ tx, ctx, args });
	}
);

export const removePersonTag = defineMutator(
	removePersonTagMutatorSchemaZero,
	async ({ tx, args, ctx }) => {
		if (tx.location !== 'server') {
			throw new Error('removePersonTag can only be called from the server');
		}
		await personTagDataFunctions.removePersonTag({ tx, ctx, args });
	}
);
