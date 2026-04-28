import * as v from 'valibot';
import * as helpers from '$lib/schema/helpers';

export const teamSchema = v.object({
	id: helpers.uuid,
	organizationId: helpers.uuid,
	name: helpers.shortString,
	parentTeamId: v.nullable(helpers.uuid),
	createdAt: helpers.date,
	updatedAt: helpers.date,
	deletedAt: v.nullable(helpers.date)
});
export type TeamSchema = v.InferOutput<typeof teamSchema>;

export const teamApiSchema = v.object({
	...v.omit(teamSchema, ['organizationId']).entries,
	createdAt: helpers.dateToString,
	updatedAt: helpers.dateToString,
	deletedAt: v.nullable(helpers.dateToString)
});

export const teamPersonApiSchema = v.object({
	teamId: helpers.uuid,
	personId: helpers.uuid
});

export const teamUserApiSchema = v.object({
	teamId: helpers.uuid,
	userId: helpers.uuid
});

export const readTeamRest = v.object({
	id: teamSchema.entries.id,
	name: teamSchema.entries.name,
	parentTeamId: teamSchema.entries.parentTeamId,
	createdAt: helpers.dateToString,
	updatedAt: helpers.dateToString,
	deletedAt: v.nullable(helpers.dateToString)
});
export type ReadTeamRest = v.InferOutput<typeof readTeamRest>;

export const readTeamZero = v.object({
	...readTeamRest.entries,
	createdAt: helpers.dateToTimestamp,
	updatedAt: helpers.dateToTimestamp,
	deletedAt: v.nullable(helpers.dateToTimestamp)
});
export type ReadTeamZero = v.InferOutput<typeof readTeamZero>;

export const createTeam = v.object({
	name: teamSchema.entries.name,
	parentTeamId: v.nullable(teamSchema.entries.parentTeamId)
});
export type CreateTeam = v.InferInput<typeof createTeam>;

export const updateTeam = v.partial(
	v.object({
		name: teamSchema.entries.name,
		parentTeamId: v.optional(v.nullable(teamSchema.entries.parentTeamId), null),
		deletedAt: v.optional(v.nullable(helpers.unixTimestamp), null)
	})
);
export type UpdateTeam = v.InferInput<typeof updateTeam>;

export const mutatorMetadata = v.object({
	organizationId: helpers.uuid,
	teamId: helpers.uuid
});
export type MutatorMetadata = v.InferOutput<typeof mutatorMetadata>;

export const createMutatorSchema = v.object({
	input: createTeam,
	metadata: mutatorMetadata
});
export type CreateMutatorSchema = v.InferInput<typeof createMutatorSchema>;

export const updateMutatorSchema = v.object({
	input: updateTeam,
	metadata: mutatorMetadata
});
export type UpdateMutatorSchema = v.InferInput<typeof updateMutatorSchema>;

export const teamMemberMutatorMetadata = v.object({
	organizationId: helpers.uuid,
	teamId: helpers.uuid,
	userId: helpers.uuid
});
export type TeamMemberMutatorMetadata = v.InferOutput<typeof teamMemberMutatorMetadata>;

export const addUserToTeamMutatorSchema = v.object({
	metadata: teamMemberMutatorMetadata
});
export type AddUserToTeamMutatorSchema = v.InferInput<typeof addUserToTeamMutatorSchema>;

export const removeUserFromTeamMutatorSchema = v.object({
	metadata: teamMemberMutatorMetadata
});
export type RemoveUserFromTeamMutatorSchema = v.InferInput<typeof removeUserFromTeamMutatorSchema>;
