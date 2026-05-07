import type { ServerTransaction } from '@rocicorp/zero';
import { drizzle } from '$lib/server/db';
import { user } from '$lib/schema/drizzle';
import { eq } from 'drizzle-orm';

export async function _getUserByIdUnsafe({
	userId,
	tx
}: {
	userId: string;
	tx?: ServerTransaction;
}) {
	const database = tx?.dbTransaction.wrappedTransaction ?? drizzle;
	return database.query.user.findFirst({
		where: eq(user.id, userId)
	});
}
