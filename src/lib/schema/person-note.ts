import * as v from 'valibot';
import * as helpers from './helpers';
import { readUserZero } from './user';

export const personNoteSchema = v.object({
	id: helpers.uuid,
	organizationId: helpers.uuid,
	personId: helpers.uuid,
	note: helpers.mediumString,
	userId: helpers.uuid,
	createdAt: helpers.date,
	updatedAt: helpers.date,
	deletedAt: v.nullable(helpers.date)
});
export type PersonNoteSchema = v.InferOutput<typeof personNoteSchema>;

export const personNoteApiSchema = v.object({
	...v.omit(personNoteSchema, ['organizationId']).entries,
	createdAt: helpers.dateToString,
	updatedAt: helpers.dateToString,
	deletedAt: v.nullable(helpers.dateToString)
});

export const readPersonNoteZero = v.object({
	id: personNoteSchema.entries.id,
	personId: personNoteSchema.entries.personId,
	organizationId: personNoteSchema.entries.organizationId,
	note: personNoteSchema.entries.note,
	userId: personNoteSchema.entries.userId,
	createdAt: helpers.unixTimestamp,
	updatedAt: helpers.unixTimestamp,
	deletedAt: v.nullable(helpers.unixTimestamp)
});
export type ReadPersonNoteZero = v.InferOutput<typeof readPersonNoteZero>;

export const readPersonNoteWithUserZero = v.object({
	id: personNoteSchema.entries.id,
	personId: personNoteSchema.entries.personId,
	note: personNoteSchema.entries.note,
	userId: personNoteSchema.entries.userId,
	createdAt: helpers.unixTimestamp,
	updatedAt: helpers.unixTimestamp,
	deletedAt: v.nullable(helpers.unixTimestamp),
	user: readUserZero
});
export type ReadPersonNoteWithUserZero = v.InferOutput<typeof readPersonNoteWithUserZero>;

export const createPersonNoteZero = v.object({
	note: personNoteSchema.entries.note
});
export type CreatePersonNoteZero = v.InferOutput<typeof createPersonNoteZero>;

export const createPersonNoteApi = v.object({
	note: personNoteSchema.entries.note,
	userId: helpers.uuid //needed because we don't have a logged in user ID when creating a note via the API
});
export type CreatePersonNoteApi = v.InferOutput<typeof createPersonNoteApi>;

export const updatePersonNoteZero = v.object({
	note: personNoteSchema.entries.note
});
export type UpdatePersonNoteZero = v.InferOutput<typeof updatePersonNoteZero>;

export const mutatorMetadata = v.object({
	personNoteId: helpers.uuid,
	organizationId: helpers.uuid,
	personId: helpers.uuid,
	userId: helpers.uuid
});
export type MutatorMetadata = v.InferOutput<typeof mutatorMetadata>;

export const createMutatorSchemaZero = v.object({
	input: createPersonNoteZero,
	metadata: mutatorMetadata
});
export type CreateMutatorSchemaZero = v.InferOutput<typeof createMutatorSchemaZero>;

export const updateMutatorSchemaZero = v.object({
	input: updatePersonNoteZero,
	metadata: mutatorMetadata
});
export type UpdateMutatorSchemaZero = v.InferOutput<typeof updateMutatorSchemaZero>;

export const deleteMutatorSchemaZero = v.object({
	metadata: mutatorMetadata
});
export type DeleteMutatorSchemaZero = v.InferOutput<typeof deleteMutatorSchemaZero>;
