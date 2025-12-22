import * as v from 'valibot';
import * as helpers from '$lib/schema/helpers';

export const whatsappGroupSchema = v.object({
	id: helpers.uuid,
	organizationId: helpers.uuid,
	name: helpers.shortString,
	profilePicture: v.nullable(helpers.url),
	teamId: v.nullable(helpers.uuid),
	automaticallyAddMembersToTeam: v.boolean(),
	automaticallyRemoveMembersFromTeam: v.boolean(),
	inviteCode: helpers.mediumString,
	externalId: helpers.mediumString,
	createdAt: helpers.date,
	updatedAt: helpers.date
});
export type WhatsappGroupSchema = v.InferOutput<typeof whatsappGroupSchema>;

export const readWhatsappGroupRest = v.object({
	...v.omit(whatsappGroupSchema, ['organizationId']).entries,
	createdAt: helpers.dateToString,
	updatedAt: helpers.dateToString
});
export type ReadWhatsappGroupRest = v.InferOutput<typeof readWhatsappGroupRest>;

export const readWhatsappGroupZero = v.object({
	...whatsappGroupSchema.entries,
	createdAt: helpers.dateToTimestamp,
	updatedAt: helpers.dateToTimestamp
});
export type ReadWhatsappGroupZero = v.InferOutput<typeof readWhatsappGroupZero>;

export const createWhatsappGroup = v.object({
	name: whatsappGroupSchema.entries.name,
	profilePicture: v.optional(v.nullable(whatsappGroupSchema.entries.profilePicture)),
	teamId: v.optional(v.nullable(whatsappGroupSchema.entries.teamId)),
	automaticallyAddMembersToTeam: v.optional(
		whatsappGroupSchema.entries.automaticallyAddMembersToTeam,
		false
	),
	automaticallyRemoveMembersFromTeam: v.optional(
		whatsappGroupSchema.entries.automaticallyRemoveMembersFromTeam,
		false
	),
	inviteCode: whatsappGroupSchema.entries.inviteCode,
	externalId: v.optional(v.nullable(whatsappGroupSchema.entries.externalId))
});
export type CreateWhatsappGroup = v.InferInput<typeof createWhatsappGroup>;

export const updateWhatsappGroup = v.partial(
	v.object({
		name: whatsappGroupSchema.entries.name,
		profilePicture: v.optional(v.nullable(whatsappGroupSchema.entries.profilePicture)),
		automaticallyAddMembersToTeam: v.optional(
			whatsappGroupSchema.entries.automaticallyAddMembersToTeam
		),
		automaticallyRemoveMembersFromTeam: v.optional(
			whatsappGroupSchema.entries.automaticallyRemoveMembersFromTeam
		),
		externalId: v.optional(whatsappGroupSchema.entries.externalId),
		inviteCode: v.optional(whatsappGroupSchema.entries.inviteCode)
	})
);
export type UpdateWhatsappGroup = v.InferInput<typeof updateWhatsappGroup>;

export const mutatorMetadata = v.object({
	organizationId: whatsappGroupSchema.entries.organizationId,
	whatsappGroupId: whatsappGroupSchema.entries.id
});
export type MutatorMetadata = v.InferOutput<typeof mutatorMetadata>;

export const createMutatorSchema = v.object({
	input: createWhatsappGroup,
	metadata: mutatorMetadata
});
export type CreateMutatorSchema = v.InferInput<typeof createMutatorSchema>;
export type CreateMutatorSchemaOutput = v.InferOutput<typeof createMutatorSchema>;

export const updateMutatorSchema = v.object({
	input: updateWhatsappGroup,
	metadata: mutatorMetadata
});
export type UpdateMutatorSchema = v.InferInput<typeof updateMutatorSchema>;
export type UpdateMutatorSchemaOutput = v.InferOutput<typeof updateMutatorSchema>;
