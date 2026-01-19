import type { MutatorParams } from '$lib/zero/schema';
import type { Transaction } from '$lib/server/db/zeroDrizzle';

import {
	type CreateMutatorSchemaZeroOutput,
	type UpdateMutatorSchemaZeroOutput,
	type DeleteMutatorSchemaZero,
	updateEmailFromSignatureZero
} from '$lib/schema/email-from-signature';
import { parse } from 'valibot';

import { emailFromSignature, organization } from '$lib/schema/drizzle';
import { eq, and } from 'drizzle-orm';
import { emailFromSignatureReadPermissions } from '$lib/zero/query/email_from_signature/permissions';
import {
	createSendSignature,
	updateSendSignature,
	type PostmarkReadSendSignatureBody
} from '$lib/server/api/utils/postmark';
import pino from '$lib/pino';

const log = pino(import.meta.url);

export function createEmailFromSignature(params: MutatorParams) {
	return async function (tx: Transaction, input: CreateMutatorSchemaZeroOutput) {
		const [organizationRecord] = await tx.dbTransaction.wrappedTransaction
			.select()
			.from(organization)
			.where(eq(organization.id, input.metadata.organizationId))
			.limit(1);
		if (!organizationRecord) {
			throw new Error('Organization not found');
		}

		// only admin/owner can create email signatures
		if (
			![...params.queryContext.adminOrgs, ...params.queryContext.ownerOrgs].includes(
				organizationRecord.id
			)
		) {
			throw new Error('You are not authorized to create an email signature in this organization');
		}

		// Create in Postmark first
		let postmarkResult: PostmarkReadSendSignatureBody | null = null;
		try {
			postmarkResult = await createSendSignature({
				organizationId: input.metadata.organizationId,
				emailFromSignature: input.input
			});
		} catch (err) {
			log.error({ err }, 'Failed to create send signature in Postmark');
			throw new Error('Failed to create send signature in Postmark');
		}

		const emailFromSignatureToInsert: typeof emailFromSignature.$inferInsert = {
			id: input.metadata.emailFromSignatureId,
			organizationId: input.metadata.organizationId,
			teamId: null,
			name: input.input.name,
			emailAddress: input.input.emailAddress,
			externalId: postmarkResult.ID.toString(),
			replyTo: input.input.replyTo,
			verified: postmarkResult.Confirmed,
			returnPathDomain: postmarkResult.ReturnPathDomain || null,
			returnPathDomainVerified: postmarkResult.ReturnPathDomainVerified ?? false,
			createdAt: new Date(),
			updatedAt: new Date(),
			deletedAt: null
		};

		const [result] = await tx.dbTransaction.wrappedTransaction
			.insert(emailFromSignature)
			.values(emailFromSignatureToInsert)
			.returning();
		if (!result) {
			throw new Error('Unable to create email from signature');
		}

		params.result?.push(result);
	};
}

export function updateEmailFromSignature(params: MutatorParams) {
	return async function (tx: Transaction, input: UpdateMutatorSchemaZeroOutput) {
		const emailFromSignatureRecord = await tx.query.emailFromSignature
			.where('id', '=', input.metadata.emailFromSignatureId)
			.where('organizationId', '=', input.metadata.organizationId)
			.where((expr) => emailFromSignatureReadPermissions(expr, params.queryContext))
			.where('deletedAt', 'IS', null)
			.one()
			.run();
		if (!emailFromSignatureRecord) {
			throw new Error('Email from signature not found');
		}

		// only admin/owner can update email signatures
		if (
			![...params.queryContext.adminOrgs, ...params.queryContext.ownerOrgs].includes(
				input.metadata.organizationId
			)
		) {
			throw new Error('You are not authorized to update this email signature');
		}

		const parseUpdateParams = parse(updateEmailFromSignatureZero, input.input);

		// If we have an externalId, update in Postmark
		if (emailFromSignatureRecord.externalId) {
			try {
				const postmarkResult = await updateSendSignature({
					emailSignatureExternalId: parseInt(emailFromSignatureRecord.externalId),
					signatureBody: {
						Name: parseUpdateParams.name,
						ReplyToEmail: parseUpdateParams.replyTo || undefined,
						ReturnPathDomain: parseUpdateParams.returnPathDomain || undefined
					}
				});

				// Update with Postmark response data
				await tx.dbTransaction.wrappedTransaction
					.update(emailFromSignature)
					.set({
						...parseUpdateParams,
						verified: postmarkResult.Confirmed,
						returnPathDomainVerified: postmarkResult.ReturnPathDomainVerified ?? false,
						updatedAt: new Date()
					})
					.where(
						and(
							eq(emailFromSignature.id, input.metadata.emailFromSignatureId),
							eq(emailFromSignature.organizationId, input.metadata.organizationId)
						)
					);
			} catch (err) {
				log.error({ err }, 'Failed to update send signature in Postmark');
				throw new Error('Failed to update send signature in Postmark');
			}
		} else {
			// No externalId, just update locally (system signature)
			await tx.dbTransaction.wrappedTransaction
				.update(emailFromSignature)
				.set({
					...parseUpdateParams,
					updatedAt: new Date()
				})
				.where(
					and(
						eq(emailFromSignature.id, input.metadata.emailFromSignatureId),
						eq(emailFromSignature.organizationId, input.metadata.organizationId)
					)
				);
		}
	};
}

export function deleteEmailFromSignature(params: MutatorParams) {
	return async function (tx: Transaction, input: DeleteMutatorSchemaZero) {
		const emailFromSignatureRecord = await tx.query.emailFromSignature
			.where('id', '=', input.metadata.emailFromSignatureId)
			.where('organizationId', '=', input.metadata.organizationId)
			.where((expr) => emailFromSignatureReadPermissions(expr, params.queryContext))
			.where('deletedAt', 'IS', null)
			.one()
			.run();
		if (!emailFromSignatureRecord) {
			throw new Error('Email from signature not found');
		}

		// Check permissions
		if (
			![...params.queryContext.adminOrgs, ...params.queryContext.ownerOrgs].includes(
				input.metadata.organizationId
			)
		) {
			throw new Error('You are not authorized to delete this email signature');
		}

		// Soft delete - don't delete from Postmark
		await tx.dbTransaction.wrappedTransaction
			.update(emailFromSignature)
			.set({
				deletedAt: new Date(),
				updatedAt: new Date()
			})
			.where(
				and(
					eq(emailFromSignature.id, input.metadata.emailFromSignatureId),
					eq(emailFromSignature.organizationId, input.metadata.organizationId)
				)
			);
	};
}
