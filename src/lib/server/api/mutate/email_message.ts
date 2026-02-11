import { defineMutator } from '@rocicorp/zero';
import * as dataFunctions from '$lib/server/api/data/email/message';

import {
	createMutatorSchema,
	updateMutatorSchema,
	sendMutatorSchema,
	deleteMutatorSchema
} from '$lib/schema/email-message';

export const createEmailMessage = defineMutator(createMutatorSchema, async ({ tx, args, ctx }) => {
	if (tx.location !== 'server') {
		throw new Error('createEmailMessage can only be called from the server');
	}
	await dataFunctions.createEmailMessage({ tx, ctx, args });
});

export const updateEmailMessage = defineMutator(updateMutatorSchema, async ({ tx, args, ctx }) => {
	if (tx.location !== 'server') {
		throw new Error('updateEmailMessage can only be called from the server');
	}
	await dataFunctions.updateEmailMessage({ tx, ctx, args });
});

export const deleteEmailMessage = defineMutator(deleteMutatorSchema, async ({ tx, args, ctx }) => {
	if (tx.location !== 'server') {
		throw new Error('deleteEmailMessage can only be called from the server');
	}
	await dataFunctions.deleteEmailMessage({ tx, ctx, args });
});

export const sendEmailMessage = defineMutator(sendMutatorSchema, async ({ tx, args, ctx }) => {
	if (tx.location !== 'server') {
		throw new Error('sendEmailMessage can only be called from the server');
	}
	await dataFunctions.sendEmailMessage({ tx, ctx, args });
});
