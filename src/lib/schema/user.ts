import * as v from 'valibot';
import * as helpers from '$lib/schema/helpers';

import { LOCALES } from '$lib/utils/language';

export const DEFAULT_USER_PREFERENCES = {
	preferredLanguage: 'en'
} as const;

export const userPreferencesSchema = v.optional(
	v.object({
		preferredLanguage: v.optional(
			v.picklist(LOCALES, 'Invalid language code'),
			DEFAULT_USER_PREFERENCES.preferredLanguage
		)
	}),
	DEFAULT_USER_PREFERENCES
);
export type UserPreferencesSchema = v.InferOutput<typeof userPreferencesSchema>;

export const userSchema = v.object({
	id: helpers.uuid,
	name: helpers.mediumString,
	email: helpers.email,
	emailVerified: v.boolean(),
	image: v.nullable(helpers.url),
	twoFactorEnabled: v.boolean(),
	stripeCustomerId: v.nullable(helpers.shortString),
	preferences: v.nullable(userPreferencesSchema),
	createdAt: helpers.date,
	updatedAt: helpers.date
});
export type UserSchema = v.InferOutput<typeof userSchema>;

export const readUserRest = v.object({
	id: userSchema.entries.id,
	name: userSchema.entries.name,
	email: userSchema.entries.email,
	image: userSchema.entries.image,
	twoFactorEnabled: userSchema.entries.twoFactorEnabled,
	preferences: userSchema.entries.preferences,
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
	image: v.optional(v.nullable(helpers.url), null)
});
export type CreateUser = v.InferInput<typeof createUser>;

export const updateUser = v.partial(
	v.object({
		name: userSchema.entries.name,
		image: v.optional(v.nullable(helpers.url), null),
		preferences: v.optional(userPreferencesSchema, DEFAULT_USER_PREFERENCES)
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
