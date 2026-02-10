import type { ServerTransaction } from '@rocicorp/zero';
import { actionCode } from '$lib/schema/drizzle';
import { nanoid } from '$lib/schema/helpers';
import { type ActionCodeType } from '$lib/schema/action-code';

export async function _insertActionCodeUnsafe({
	tx,
	args: { organizationId, type, referenceId }
}: {
	tx: ServerTransaction;
	args: {
		organizationId: string;
		type: ActionCodeType;
		referenceId: string;
	};
}) {
	const result = await tx.dbTransaction.wrappedTransaction.insert(actionCode).values({
		id: nanoid(),
		organizationId: organizationId,
		referenceId: referenceId,
		type: type,
		createdAt: new Date()
	});
	return result;
}
