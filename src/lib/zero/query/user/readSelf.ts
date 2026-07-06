import { defineQuery } from '@rocicorp/zero';
import { object } from 'valibot';
import { builder } from '$lib/zero/schema';
import type { QueryContext } from '$lib/zero/schema';

export function readUserSelfQuery({ ctx }: { ctx: QueryContext }) {
	return builder.user.where('id', '=', ctx.userId ?? '').one();
}

export const readUserSelf = defineQuery(object({}), ({ ctx }) => {
	return readUserSelfQuery({ ctx });
});

export { readUserSelfZero as outputSchema } from '$lib/schema/user';
