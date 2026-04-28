import * as v from 'valibot';
import * as helpers from '$lib/schema/helpers';

import { LOCALES } from '$lib/utils/language';

export const userRole = v.picklist(['member', 'admin', 'owner']);
export type UserRole = v.InferOutput<typeof userRole>;

export const userSchema = v.object({
	id: helpers.uuid,
	name: helpers.mediumString,
	email: helpers.email,
	emailVerified: v.boolean(),
	image: v.nullable(helpers.url),
	twoFactorEnabled: v.boolean(),
	stripeCustomerId: v.nullable(helpers.shortString),
	preferredLanguage: v.nullable(v.picklist(LOCALES, 'Invalid language code')),
	createdAt: helpers.date,
	updatedAt: helpers.date
});
export type UserSchema = v.InferOutput<typeof userSchema>;

export const readUserRest = v.object({
	id: userSchema.entries.id,
	name: userSchema.entries.name,
	email: userSchema.entries.email,
	image: userSchema.entries.image,
	preferredLanguage: userSchema.entries.preferredLanguage,
	twoFactorEnabled: userSchema.entries.twoFactorEnabled,
	createdAt: helpers.dateToString,
	updatedAt: helpers.dateToString
});
export type ReadUserRest = v.InferOutput<typeof readUserRest>;

export const readUserZero = v.object({
	...readUserRest.entries,
	createdAt: helpers.dateToTimestamp,
	updatedAt: helpers.dateToTimestamp
});
export type ReadUserZero = v.InferOutput<typeof readUserZero>;

export const createUser = v.object({
	name: userSchema.entries.name,
	email: userSchema.entries.email,
	preferredLanguage: v.optional(userSchema.entries.preferredLanguage),
	image: v.optional(v.nullable(helpers.url), null)
});
export type CreateUser = v.InferInput<typeof createUser>;

export const updateUser = v.partial(
	v.object({
		name: userSchema.entries.name,
		image: v.optional(v.nullable(helpers.url), null),
		preferredLanguage: v.optional(userSchema.entries.preferredLanguage)
	})
);
export type UpdateUser = v.InferInput<typeof updateUser>;

export const mutatorMetadata = v.object({
	organizationId: helpers.uuid,
	userId: helpers.uuid
});
export type MutatorMetadata = v.InferOutput<typeof mutatorMetadata>;

export const createMutatorSchema = v.object({
	input: createUser,
	metadata: mutatorMetadata
});

export const updateMutatorSchema = v.object({
	input: updateUser,
	metadata: mutatorMetadata
});
export type UpdateMutatorSchema = v.InferInput<typeof updateMutatorSchema>;
