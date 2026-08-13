import type { ServerTransaction } from '@rocicorp/zero';

import type { FavouriteReference } from '$lib/schema/favourite';
import { eventReadPermissions } from '$lib/zero/query/event/permissions';
import { personReadPermissions } from '$lib/zero/query/person/permissions';
import { petitionReadPermissions } from '$lib/zero/query/petition/permissions';
import { builder, type QueryContext } from '$lib/zero/schema';

export async function isFavouriteReferenceReadable({
	tx,
	ctx,
	organizationId,
	reference
}: {
	tx: ServerTransaction;
	ctx: QueryContext;
	organizationId: string;
	reference: FavouriteReference;
}): Promise<boolean> {
	let record;
	switch (reference.referenceType) {
		case 'person':
			record = await tx.run(
				builder.person
					.where('id', '=', reference.referenceId)
					.where('organizationId', '=', organizationId)
					.where('deletedAt', 'IS', null)
					.where((expr) => personReadPermissions(expr, ctx))
					.one()
			);
			break;
		case 'petition':
			record = await tx.run(
				builder.petition
					.where('id', '=', reference.referenceId)
					.where('organizationId', '=', organizationId)
					.where('deletedAt', 'IS', null)
					.where((expr) => petitionReadPermissions(expr, ctx))
					.one()
			);
			break;
		case 'event':
			record = await tx.run(
				builder.event
					.where('id', '=', reference.referenceId)
					.where('organizationId', '=', organizationId)
					.where('deletedAt', 'IS', null)
					.where((expr) => eventReadPermissions(expr, ctx))
					.one()
			);
			break;
	}

	return record !== undefined;
}
