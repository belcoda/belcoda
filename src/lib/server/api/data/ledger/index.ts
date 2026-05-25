import { ledger, organization } from '$lib/schema/drizzle';
import { parse } from 'valibot';
import { ledgerSchema } from '$lib/schema/ledger';
import type { ServerTransaction } from '@rocicorp/zero';
import type { CreateLedgerEntrySchema, LedgerEntryMetadataSchema } from '$lib/schema/ledger';
import { v7 as uuidv7 } from 'uuid';
import { eq, sql } from 'drizzle-orm';

export const DEFAULT_EMAIL_COST_IN_HUNDREDTHS_OF_CENTS = 18; // $0.0018 in USD

/**
 * Internal function to create a ledger entry.
 * @param tx - The transaction object.
 * @param args - The arguments for the ledger entry.
 * @returns The created ledger entry.
 */
export async function _createLedgerEntry({
	tx,
	args
}: {
	tx: ServerTransaction;
	args: CreateLedgerEntrySchema;
}) {
	const parsed = await parse(ledgerSchema, args);
	const insertedId = uuidv7();
	const toInsert: typeof ledger.$inferInsert = {
		id: insertedId,
		organizationId: parsed.organizationId,
		deltaInUsdHundredthsOfCents: parsed.deltaInUsdHundredthsOfCents,
		idempotencyKey: createLedgerEntryIdempotencyKey(parsed.metadata),
		metadata: parsed.metadata
	};
	const result = await tx.dbTransaction.wrappedTransaction
		.insert(ledger)
		.values(toInsert)
		.returning();
	// we want to fail if it didn't insert (eg: due to a unique constraint violation on the idempotency key)
	// if we didn't fail, we would end up updating the organization balance twice for the same delta
	if (result.length === 0) {
		throw new Error('Failed to create ledger entry');
	}
	await tx.dbTransaction.wrappedTransaction
		.update(organization)
		.set({
			balance: sql`${organization.balance} + ${parsed.deltaInUsdHundredthsOfCents}`
		})
		.where(eq(organization.id, parsed.organizationId));
}

const createLedgerEntryIdempotencyKey = (metadata: LedgerEntryMetadataSchema) => {
	switch (metadata.type) {
		case 'added_from_stripe':
			return `${metadata.type}-${metadata.stripeCheckoutSessionId}`;
		case 'whatsapp_message_outgoing':
			return `${metadata.type}-${metadata.whatsappMessageId}`;
		case 'email_message_outgoing':
			return `${metadata.type}-${metadata.emailMessageId}`;
		default:
			throw new Error(`Unknown ledger entry metadata type: ${JSON.stringify(metadata)}`);
	}
};
