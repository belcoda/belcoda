import { defineMutator } from '@rocicorp/zero';

import {
	addFavouriteMutatorSchemaZero,
	removeFavouriteMutatorSchemaZero
} from '$lib/schema/favourite';

export const addFavourite = defineMutator(addFavouriteMutatorSchemaZero, async ({ tx, args }) => {
	tx.mutate.memberFavourite.insert({
		id: args.metadata.favouriteId,
		organizationId: args.metadata.organizationId,
		memberId: args.metadata.memberId,
		referenceType: args.metadata.referenceType,
		referenceId: args.metadata.referenceId,
		createdAt: Date.now()
	});
});

export const removeFavourite = defineMutator(
	removeFavouriteMutatorSchemaZero,
	async ({ tx, args }) => {
		tx.mutate.memberFavourite.delete({
			id: args.metadata.favouriteId
		});
	}
);
