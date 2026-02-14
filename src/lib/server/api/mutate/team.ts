import * as teamData from '$lib/server/api/data/team/team';
import * as teamMemberData from '$lib/server/api/data/team/member';
import { defineMutator } from '@rocicorp/zero';
import {
	updateMutatorSchema,
	createMutatorSchema,
	addUserToTeamMutatorSchema,
	removeUserFromTeamMutatorSchema
} from '$lib/schema/team';

export const createTeam = defineMutator(createMutatorSchema, async ({ tx, args, ctx }) => {
	if (tx.location !== 'server') {
		throw new Error('createTeam can only be called from the server');
	}
	await teamData.createTeam({ tx, ctx, args });
});

export const updateTeam = defineMutator(updateMutatorSchema, async ({ tx, args, ctx }) => {
	if (tx.location !== 'server') {
		throw new Error('updateTeam can only be called from the server');
	}
	await teamData.updateTeam({ tx, ctx, args });
});

export const addUserToTeam = defineMutator(
	addUserToTeamMutatorSchema,
	async ({ tx, args, ctx }) => {
		if (tx.location !== 'server') {
			throw new Error('addUserToTeam can only be called from the server');
		}
		await teamMemberData.addUserToTeam({ tx, ctx, args });
	}
);

export const removeUserFromTeam = defineMutator(
	removeUserFromTeamMutatorSchema,
	async ({ tx, args, ctx }) => {
		if (tx.location !== 'server') {
			throw new Error('removeUserFromTeam can only be called from the server');
		}
		await teamMemberData.removeUserFromTeam({ tx, ctx, args });
	}
);
