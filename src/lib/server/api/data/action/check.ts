import { eq, isNull, and } from 'drizzle-orm';
import { actionCode } from '$lib/schema/drizzle';
import type { ServerTransaction } from '@rocicorp/zero';

export async function _getActionCodeUnsafe({ tx, code }: { tx: ServerTransaction; code: string }) {
	const result = await tx.dbTransaction.wrappedTransaction.query.actionCode.findFirst({
		where: and(eq(actionCode.id, code), isNull(actionCode.deletedAt))
	});
	return result;
}
