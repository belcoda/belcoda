import type { ServerTransaction } from '@rocicorp/zero';
import { drizzle } from '$lib/server/db';
import { user } from '$lib/schema/drizzle';
import { eq } from 'drizzle-orm';
import type { UpdateUserSettingsMutatorSchemaZero } from '$lib/schema/user';
import { mergeUserSettings } from '$lib/schema/user/settings';
import type { QueryContext } from '$lib/zero/schema';

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

export async function updateUserSettings({
	tx,
	ctx,
	args
}: {
	tx: ServerTransaction;
	ctx: QueryContext & { userId: string };
	args: UpdateUserSettingsMutatorSchemaZero;
}) {
	if (ctx.userId !== args.metadata.userId) {
		throw new Error('Forbidden');
	}

	const row = await _getUserByIdUnsafe({ userId: args.metadata.userId, tx });
	const current = row?.settings;
	const settings = mergeUserSettings(current, args.input);

	await tx.dbTransaction.wrappedTransaction
		.update(user)
		.set({ settings })
		.where(eq(user.id, args.metadata.userId));
}
