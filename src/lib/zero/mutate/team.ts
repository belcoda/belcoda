import { defineMutator } from '@rocicorp/zero';
import {
	createMutatorSchema,
	updateMutatorSchema,
	addUserToTeamMutatorSchema,
	removeUserFromTeamMutatorSchema
} from '$lib/schema/team';

export const createTeam = defineMutator(createMutatorSchema, async ({ tx, args, ctx }) => {
	const now = Date.now();
	tx.mutate.team.insert({
		id: args.metadata.teamId,
		organizationId: args.metadata.organizationId,
		name: args.input.name,
		parentTeamId: args.input.parentTeamId ?? null,
		createdAt: now,
		updatedAt: now,
		deletedAt: null
	});
});

export const updateTeam = defineMutator(updateMutatorSchema, async ({ tx, args, ctx }) => {
	const now = Date.now();
	tx.mutate.team.update({
		id: args.metadata.teamId,
		...(args.input.name !== undefined && { name: args.input.name }),
		...(Object.prototype.hasOwnProperty.call(args.input, 'parentTeamId') && {
			parentTeamId: args.input.parentTeamId ?? null
		}),
		...(Object.prototype.hasOwnProperty.call(args.input, 'deletedAt') && {
			deletedAt: args.input.deletedAt ? new Date(args.input.deletedAt).getTime() : null
		}),
		updatedAt: now
	});
});

export const addUserToTeam = defineMutator(
	addUserToTeamMutatorSchema,
	async ({ tx, args, ctx }) => {
		// Server performs the insert; client state updates via sync.
		// Optimistic insert would require matching id with server (teamMember has id PK).
	}
);

export const removeUserFromTeam = defineMutator(
	removeUserFromTeamMutatorSchema,
	async ({ tx, args, ctx }) => {
		// Server performs the delete; client state updates via sync.
		// teamMember has primary key id only, so we cannot do optimistic delete by teamId+userId here.
	}
);
