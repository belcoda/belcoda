import * as v from 'valibot';

import * as helpers from '$lib/schema/helpers';

export const favouriteReferenceTypes = ['person', 'petition', 'event'] as const;
export const favouriteReferenceType = v.picklist(favouriteReferenceTypes);
export type FavouriteReferenceType = v.InferOutput<typeof favouriteReferenceType>;

export const memberFavouriteSchema = v.object({
	id: helpers.uuid,
	organizationId: helpers.uuid,
	memberId: helpers.uuid,
	referenceType: favouriteReferenceType,
	referenceId: helpers.uuid,
	createdAt: helpers.date
});
export type MemberFavouriteSchema = v.InferOutput<typeof memberFavouriteSchema>;

export const readMemberFavouriteZero = v.object({
	...memberFavouriteSchema.entries,
	createdAt: helpers.dateToTimestamp
});
export type ReadMemberFavouriteZero = v.InferOutput<typeof readMemberFavouriteZero>;

export const favouriteReferenceSchema = v.object({
	referenceType: favouriteReferenceType,
	referenceId: helpers.uuid
});
export type FavouriteReference = v.InferOutput<typeof favouriteReferenceSchema>;

export const readFavouriteInputSchema = v.object({
	organizationId: helpers.uuid,
	...favouriteReferenceSchema.entries
});
export type ReadFavouriteInput = v.InferOutput<typeof readFavouriteInputSchema>;

export const addFavouriteMutatorSchemaZero = v.object({
	metadata: v.object({
		favouriteId: helpers.uuid,
		organizationId: helpers.uuid,
		memberId: helpers.uuid,
		...favouriteReferenceSchema.entries
	})
});
export type AddFavouriteMutatorSchemaZero = v.InferOutput<typeof addFavouriteMutatorSchemaZero>;

export const removeFavouriteMutatorSchemaZero = v.object({
	metadata: v.object({
		favouriteId: helpers.uuid,
		organizationId: helpers.uuid,
		memberId: helpers.uuid,
		...favouriteReferenceSchema.entries
	})
});
export type RemoveFavouriteMutatorSchemaZero = v.InferOutput<
	typeof removeFavouriteMutatorSchemaZero
>;
