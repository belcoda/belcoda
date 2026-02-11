import { type Transaction } from '@rocicorp/zero';
import { type Schema, builder } from '$lib/zero/schema';
import { defineMutator } from '@rocicorp/zero';

import {
	type CreateMutatorSchemaZeroOutput,
	type UpdateMutatorSchemaZeroOutput,
	type DeleteMutatorSchemaZero,
	type VerifyMutatorSchemaZero,
	type SetDefaultSignatureMutatorSchemaZero,
	type UpdateSystemFromIdentityMutatorSchemaZero
} from '$lib/schema/email-from-signature';
import {
	createMutatorSchema,
	updateMutatorSchema,
	deleteMutatorSchemaZero,
	verifyMutatorSchemaZero,
	setDefaultSignatureMutatorSchemaZero,
	updateSystemFromIdentityMutatorSchemaZero
} from '$lib/schema/email-from-signature';

export const createEmailFromSignature = defineMutator(
	createMutatorSchema,
	async ({ tx, args, ctx }) => {
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
	}
);

export const updateEmailFromSignature = defineMutator(
	updateMutatorSchema,
	async ({ tx, args, ctx }) => {
		tx.mutate.emailFromSignature.update({
			id: args.metadata.emailFromSignatureId,
			...args.input,
			updatedAt: new Date().getTime()
		});
	}
);

export const deleteEmailFromSignature = defineMutator(
	deleteMutatorSchemaZero,
	async ({ tx, args, ctx }) => {
		tx.mutate.emailFromSignature.update({
			id: args.metadata.emailFromSignatureId,
			deletedAt: new Date().getTime(),
			updatedAt: new Date().getTime()
		});
	}
);

export const verifyEmailFromSignature = defineMutator(
	verifyMutatorSchemaZero,
	async ({ tx, args, ctx }) => {
		tx.mutate.emailFromSignature.update({
			id: args.metadata.emailFromSignatureId,
			updatedAt: new Date().getTime()
		});
	}
);

export const setDefaultSignature = defineMutator(
	setDefaultSignatureMutatorSchemaZero,
	async ({ tx, args, ctx }) => {
		const currentOrg = await tx.run(
			builder.organization.where('id', '=', args.metadata.organizationId).one()
		);

		if (!currentOrg) {
			throw new Error('Organization not found');
		}

		tx.mutate.organization.update({
			id: args.metadata.organizationId,
			settings: {
				...currentOrg.settings,
				email: {
					...currentOrg.settings?.email,
					defaultFromSignatureId: args.input.defaultFromSignatureId
				}
			},
			updatedAt: new Date().getTime()
		});
	}
);

export const updateSystemFromIdentity = defineMutator(
	updateSystemFromIdentityMutatorSchemaZero,
	async ({ tx, args, ctx }) => {
		const currentOrg = await tx.run(
			builder.organization.where('id', '=', args.metadata.organizationId).one()
		);

		if (!currentOrg) {
			throw new Error('Organization not found');
		}

		tx.mutate.organization.update({
			id: args.metadata.organizationId,
			settings: {
				...currentOrg.settings,
				email: {
					...currentOrg.settings?.email,
					systemFromIdentity: {
						...currentOrg.settings?.email?.systemFromIdentity,
						...(args.input.name !== undefined && { name: args.input.name }),
						...(args.input.replyTo !== undefined && { replyTo: args.input.replyTo })
					}
				}
			},
			updatedAt: new Date().getTime()
		});
	}
);
