import { defineMutator } from '@rocicorp/zero';

import {
	addFavouriteMutatorSchemaZero,
	removeFavouriteMutatorSchemaZero
} from '$lib/schema/favourite';
import * as dataFunctions from '$lib/server/api/data/favourite/favourite';

export const addFavourite = defineMutator(
	addFavouriteMutatorSchemaZero,
	async ({ tx, args, ctx }) => {
		if (tx.location !== 'server') {
			throw new Error('addFavourite can only be called from the server');
		}
		if (!ctx.userId) {
			throw new Error('addFavourite can only be called by a user');
		}
		await dataFunctions.addFavourite({
			tx,
			ctx: { ...ctx, userId: ctx.userId },
			args
		});
	}
);

export const removeFavourite = defineMutator(
	removeFavouriteMutatorSchemaZero,
	async ({ tx, args, ctx }) => {
		if (tx.location !== 'server') {
			throw new Error('removeFavourite can only be called from the server');
		}
		if (!ctx.userId) {
			throw new Error('removeFavourite can only be called by a user');
		}
		await dataFunctions.removeFavourite({
			tx,
			ctx: { ...ctx, userId: ctx.userId },
			args
		});
	}
);
