import { defineQuery } from '@rocicorp/zero';
import * as v from 'valibot';

import { favouriteReferenceType, readMemberFavouriteZero } from '$lib/schema/favourite';
import { uuid } from '$lib/schema/helpers';
import { memberFavouriteReadPermissions } from '$lib/zero/query/member_favourite/permissions';
import { builder } from '$lib/zero/schema';

export const inputSchema = v.object({
	organizationId: uuid,
	referenceType: favouriteReferenceType,
	referenceIds: v.array(uuid)
});

export const listFavouritesByReferenceIds = defineQuery(inputSchema, ({ ctx, args }) =>
	builder.memberFavourite
		.where('organizationId', '=', args.organizationId)
		.where('referenceType', '=', args.referenceType)
		.where('referenceId', 'IN', args.referenceIds)
		.where((expr) => memberFavouriteReadPermissions(expr, ctx))
		.limit(Math.max(args.referenceIds.length, 1))
);

export const outputSchema = v.array(readMemberFavouriteZero);
