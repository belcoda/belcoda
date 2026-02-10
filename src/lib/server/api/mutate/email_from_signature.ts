import {
	createMutatorSchemaZero,
	updateMutatorSchemaZero,
	deleteMutatorSchemaZero,
	verifyMutatorSchemaZero,
	setDefaultSignatureMutatorSchemaZero,
	updateSystemFromIdentityMutatorSchemaZero
} from '$lib/schema/email-from-signature';

import * as dataFunctions from '$lib/server/api/data/email/from_signature';
import { defineMutator } from '@rocicorp/zero';

export const createEmailFromSignature = defineMutator(
	createMutatorSchemaZero,
	async ({ tx, args, ctx }) => {
		if (tx.location !== 'server') {
			throw new Error('createEmailFromSignature can only be called from the server');
		}
		await dataFunctions.createEmailFromSignature({ tx, ctx, args });
	}
);

export const updateEmailFromSignature = defineMutator(
	updateMutatorSchemaZero,
	async ({ tx, args, ctx }) => {
		if (tx.location !== 'server') {
			throw new Error('updateEmailFromSignature can only be called from the server');
		}
		await dataFunctions.updateEmailFromSignature({ tx, ctx, args });
	}
);

export const deleteEmailFromSignature = defineMutator(
	deleteMutatorSchemaZero,
	async ({ tx, args, ctx }) => {
		if (tx.location !== 'server') {
			throw new Error('deleteEmailFromSignature can only be called from the server');
		}
		await dataFunctions.deleteEmailFromSignature({ tx, ctx, args });
	}
);

export const verifyEmailFromSignature = defineMutator(
	verifyMutatorSchemaZero,
	async ({ tx, args, ctx }) => {
		if (tx.location !== 'server') {
			throw new Error('verifyEmailFromSignature can only be called from the server');
		}
		await dataFunctions.verifyEmailFromSignature({ tx, ctx, args });
	}
);

export const setDefaultSignature = defineMutator(
	setDefaultSignatureMutatorSchemaZero,
	async ({ tx, args, ctx }) => {
		if (tx.location !== 'server') {
			throw new Error('setDefaultSignature can only be called from the server');
		}
		await dataFunctions.setDefaultSignature({ tx, ctx, args });
	}
);

export const updateSystemFromIdentity = defineMutator(
	updateSystemFromIdentityMutatorSchemaZero,
	async ({ tx, args, ctx }) => {
		if (tx.location !== 'server') {
			throw new Error('updateSystemFromIdentity can only be called from the server');
		}
		await dataFunctions.updateSystemFromIdentity({ tx, ctx, args });
	}
);
