import { defineQuery } from '@rocicorp/zero';

import { readFavouriteInputSchema, readMemberFavouriteZero } from '$lib/schema/favourite';
import { memberFavouriteReadPermissions } from '$lib/zero/query/member_favourite/permissions';
import { builder } from '$lib/zero/schema';

export const readFavourite = defineQuery(readFavouriteInputSchema, ({ ctx, args }) =>
	builder.memberFavourite
		.where('organizationId', '=', args.organizationId)
		.where('referenceType', '=', args.referenceType)
		.where('referenceId', '=', args.referenceId)
		.where((expr) => memberFavouriteReadPermissions(expr, ctx))
		.one()
);

export { readMemberFavouriteZero as outputSchema };
