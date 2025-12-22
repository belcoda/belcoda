import type { Transaction } from '$lib/server/db/zeroDrizzle';
import { type MutatorParams } from '$lib/zero/schema';
import { nanoid } from '$lib/schema/helpers';

import { actionCode, organization } from '$lib/schema/drizzle';

import { type ActionCodeType } from '$lib/schema/action-code';

/**
 * Inserts an action code into the database. Unsafe because it does not check for permissions and organization membership. That should be done by the caller when it is invoked.
 * @param tx - The transaction to use.
 * @param args - The arguments to use.
 * @param args.organizationId - The organization ID to use.
 * @param args.type - The type of action code to use.
 * @param args.referenceId - The reference ID to use.
 * @returns The result of the insert
 */
export async function unsafeInsertActionCode(
	tx: Transaction,
	args: {
		organizationId: string;
		type: ActionCodeType;
		referenceId: string;
	}
) {
	let inserted = false;
	let result: typeof actionCode.$inferSelect;

	while (!inserted) {
		try {
			const attemptedResult = await tx.dbTransaction.wrappedTransaction
				.insert(actionCode)
				.values({
					id: nanoid(),
					organizationId: args.organizationId,
					referenceId: args.referenceId,
					type: args.type,
					createdAt: new Date()
				})
				.returning();
			if (attemptedResult.length > 0) {
				result = attemptedResult[0];
				inserted = true;
				return result;
			}
		} catch (error) {
			// @ts-expect-error - error is not typed, but is almost certainly going to be a postgres error
			if (error.code === '23505') {
				// Collision, try again
				continue;
			}
			throw error; // Other errors bubble up
		}
	}
}
