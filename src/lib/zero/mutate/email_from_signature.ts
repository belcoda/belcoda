import { type Transaction } from '@rocicorp/zero';
import { type Schema } from '$lib/zero/schema';

import {
	type CreateMutatorSchemaZeroOutput,
	type UpdateMutatorSchemaZeroOutput,
	type DeleteMutatorSchemaZero,
	type VerifyMutatorSchemaZero
} from '$lib/schema/email-from-signature';

export function createEmailFromSignature() {
	return async function (tx: Transaction<Schema>, args: CreateMutatorSchemaZeroOutput) {
		// Note: Postmark sync happens on the server side in the server mutator
		tx.mutate.emailFromSignature.insert({
			id: args.metadata.emailFromSignatureId,
			organizationId: args.metadata.organizationId,
			teamId: null,
			name: args.input.name,
			emailAddress: args.input.emailAddress,
			externalId: null, // Will be set by server mutator after Postmark sync
			replyTo: args.input.replyTo,
			verified: false, // Will be updated by server mutator after Postmark sync
			returnPathDomain: args.input.returnPathDomain,
			returnPathDomainVerified: false, // Will be updated by server mutator after Postmark sync
			createdAt: new Date().getTime(),
			updatedAt: new Date().getTime(),
			deletedAt: null
		});
	};
}

export function updateEmailFromSignature() {
	return async function (tx: Transaction<Schema>, args: UpdateMutatorSchemaZeroOutput) {
		// Note: Postmark sync happens on the server side in the server mutator
		tx.mutate.emailFromSignature.update({
			id: args.metadata.emailFromSignatureId,
			...args.input,
			updatedAt: new Date().getTime()
		});
	};
}

export function deleteEmailFromSignature() {
	return async function (tx: Transaction<Schema>, args: DeleteMutatorSchemaZero) {
		tx.mutate.emailFromSignature.update({
			id: args.metadata.emailFromSignatureId,
			deletedAt: new Date().getTime(),
			updatedAt: new Date().getTime()
		});
	};
}

export function verifyEmailFromSignature() {
	return async function (tx: Transaction<Schema>, args: VerifyMutatorSchemaZero) {
		tx.mutate.emailFromSignature.update({
			id: args.metadata.emailFromSignatureId,
			updatedAt: new Date().getTime()
		});
	};
}
