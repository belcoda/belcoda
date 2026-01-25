import { db } from '$lib/server/db';
import { eq, isNull, and } from 'drizzle-orm';
import { actionCode } from '$lib/schema/drizzle';

export async function _getActionCodeUnsafe({ code }: { code: string }) {
	const result = await db.query.actionCode.findFirst({
		where: and(eq(actionCode.id, code), isNull(actionCode.deletedAt))
	});
	return result;
}
