import type { Transaction } from '$lib/server/db/zeroDrizzle';
import { eq, and, isNull } from 'drizzle-orm';
import { person } from '$lib/schema/drizzle';
export async function _getPersonByPhoneNumberUnsafe({
	phoneNumber,
	organizationId,
	tx
}: {
	phoneNumber: string;
	organizationId: string;
	tx: Transaction;
}) {
	const [personRecord] = await tx.dbTransaction.wrappedTransaction
		.select()
		.from(person)
		.where(
			and(
				eq(person.phoneNumber, phoneNumber),
				eq(person.organizationId, organizationId),
				isNull(person.deletedAt)
			)
		);
	if (!personRecord) {
		throw new Error('Person not found');
	}
	return personRecord;
}
