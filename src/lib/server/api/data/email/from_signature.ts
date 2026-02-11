import type { ServerTransaction } from '@rocicorp/zero';
import { type QueryContext, builder } from '$lib/zero/schema';
import {
	createSendSignature,
	updateSendSignature,
	verifySendSignature,
	type PostmarkReadSendSignatureBody
} from '$lib/server/api/utils/postmark';

import {
	type CreateMutatorSchemaZeroOutput,
	type UpdateMutatorSchemaZeroOutput,
	type DeleteMutatorSchemaZero,
	type VerifyMutatorSchemaZero,
	type SetDefaultSignatureMutatorSchemaZero,
	type UpdateSystemFromIdentityMutatorSchemaZero,
	updateEmailFromSignatureZero
} from '$lib/schema/email-from-signature';
import { parse } from 'valibot';

import { emailFromSignature, organization } from '$lib/schema/drizzle';
import { eq, and } from 'drizzle-orm';
import { emailFromSignatureReadPermissions } from '$lib/zero/query/email_from_signature/permissions';
import pino from '$lib/pino';
const log = pino(import.meta.url);

export async function createEmailFromSignature({
	tx,
	ctx,
	args
}: {
	tx: ServerTransaction;
	ctx: QueryContext;
	args: CreateMutatorSchemaZeroOutput;
}) {
	if (tx.location !== 'server') {
		throw new Error('createEmailFromSignature can only be called from the server');
	}
	const [organizationRecord] = await tx.dbTransaction.wrappedTransaction
		.select()
		.from(organization)
		.where(eq(organization.id, args.metadata.organizationId))
		.limit(1);
	if (!organizationRecord) {
		throw new Error('Organization not found');
	}

	// only admin/owner can create email signatures
	if (![...ctx.adminOrgs, ...ctx.ownerOrgs].includes(organizationRecord.id)) {
		throw new Error('You are not authorized to create an email signature in this organization');
	}

	// Create in Postmark first
	let postmarkResult: PostmarkReadSendSignatureBody | null = null;
	try {
		postmarkResult = await createSendSignature({
			organizationId: args.metadata.organizationId,
			emailFromSignature: args.input
		});
	} catch (err) {
		log.error({ err }, 'Failed to create send signature in Postmark');
		throw new Error('Failed to create send signature in Postmark');
	}

	const emailFromSignatureToInsert: typeof emailFromSignature.$inferInsert = {
		id: args.metadata.emailFromSignatureId,
		organizationId: args.metadata.organizationId,
		teamId: null,
		name: args.input.name,
		emailAddress: args.input.emailAddress,
		externalId: postmarkResult.ID.toString(),
		replyTo: args.input.replyTo,
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

	return result;
}

export async function updateEmailFromSignature({
	tx,
	ctx,
	args
}: {
	tx: ServerTransaction;
	ctx: QueryContext;
	args: UpdateMutatorSchemaZeroOutput;
}) {
	const emailFromSignatureRecord = await tx.run(
		builder.emailFromSignature
			.where('id', '=', args.metadata.emailFromSignatureId)
			.where('organizationId', '=', args.metadata.organizationId)
			.where((expr) => emailFromSignatureReadPermissions(expr, ctx))
			.where('deletedAt', 'IS', null)
			.one()
	);

	// only admin/owner can update email signatures
	if (![...ctx.adminOrgs, ...ctx.ownerOrgs].includes(args.metadata.organizationId)) {
		throw new Error('You are not authorized to update this email signature');
	}

	const parseUpdateParams = parse(updateEmailFromSignatureZero, args.input);

	// If we have an externalId, update in Postmark
	if (emailFromSignatureRecord?.externalId) {
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
						eq(emailFromSignature.id, args.metadata.emailFromSignatureId),
						eq(emailFromSignature.organizationId, args.metadata.organizationId)
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
					eq(emailFromSignature.id, args.metadata.emailFromSignatureId),
					eq(emailFromSignature.organizationId, args.metadata.organizationId)
				)
			);
	}
}

export async function deleteEmailFromSignature({
	tx,
	ctx,
	args
}: {
	tx: ServerTransaction;
	ctx: QueryContext;
	args: DeleteMutatorSchemaZero;
}) {
	const emailFromSignatureRecord = await tx.run(
		builder.emailFromSignature
			.where('id', '=', args.metadata.emailFromSignatureId)
			.where('organizationId', '=', args.metadata.organizationId)
			.where((expr) => emailFromSignatureReadPermissions(expr, ctx))
			.where('deletedAt', 'IS', null)
			.one()
	);
	if (!emailFromSignatureRecord) {
		throw new Error('Email from signature not found');
	}

	// Check permissions
	if (![...ctx.adminOrgs, ...ctx.ownerOrgs].includes(args.metadata.organizationId)) {
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
				eq(emailFromSignature.id, args.metadata.emailFromSignatureId),
				eq(emailFromSignature.organizationId, args.metadata.organizationId)
			)
		);
}

export async function verifyEmailFromSignature({
	tx,
	ctx,
	args
}: {
	tx: ServerTransaction;
	ctx: QueryContext;
	args: VerifyMutatorSchemaZero;
}) {
	const emailFromSignatureRecord = await tx.run(
		builder.emailFromSignature
			.where('id', '=', args.metadata.emailFromSignatureId)
			.where('organizationId', '=', args.metadata.organizationId)
			.where((expr) => emailFromSignatureReadPermissions(expr, ctx))
			.where('deletedAt', 'IS', null)
			.one()
	);
	if (!emailFromSignatureRecord) {
		throw new Error('Email from signature not found');
	}

	if (![...ctx.adminOrgs, ...ctx.ownerOrgs].includes(args.metadata.organizationId)) {
		throw new Error('You are not authorized to verify this email signature');
	}

	if (!emailFromSignatureRecord.externalId) {
		throw new Error(
			'Email from signature is not referenced in external email provider. Only external signatures can be verified.'
		);
	}

	const result = await verifySendSignature({
		organizationId: emailFromSignatureRecord.organizationId,
		emailSignatureExternalId: parseInt(emailFromSignatureRecord.externalId)
	});

	const verified = result.Confirmed === true;
	const returnPathDomainVerified = result.ReturnPathDomainVerified === true;

	const [updated] = await tx.dbTransaction.wrappedTransaction
		.update(emailFromSignature)
		.set({
			verified,
			returnPathDomainVerified,
			returnPathDomain: result.ReturnPathDomain || emailFromSignatureRecord.returnPathDomain,
			updatedAt: new Date()
		})
		.where(
			and(
				eq(emailFromSignature.id, args.metadata.emailFromSignatureId),
				eq(emailFromSignature.organizationId, args.metadata.organizationId)
			)
		)
		.returning();
	if (!updated) {
		throw new Error('Failed to verify email from signature');
	}
	return updated;
}

export async function setDefaultSignature({
	tx,
	ctx,
	args
}: {
	tx: ServerTransaction;
	ctx: QueryContext;
	args: SetDefaultSignatureMutatorSchemaZero;
}) {
	if (args.input.defaultFromSignatureId === null) {
		throw new Error('Default from signature ID is required');
	}
	const signatureRecord = await tx.run(
		builder.emailFromSignature
			.where('id', '=', args.input.defaultFromSignatureId)
			.where('organizationId', '=', args.metadata.organizationId)
			.where((expr) => emailFromSignatureReadPermissions(expr, ctx))
			.where('deletedAt', 'IS', null)
			.one()
	);

	if (!signatureRecord) {
		throw new Error('Email from signature not found');
	}

	const currentOrg = await tx.dbTransaction.wrappedTransaction
		.select()
		.from(organization)
		.where(eq(organization.id, args.metadata.organizationId))
		.limit(1)
		.then((rows) => rows[0]);

	if (!currentOrg) {
		throw new Error('Organization not found');
	}

	const [result] = await tx.dbTransaction.wrappedTransaction
		.update(organization)
		.set({
			settings: {
				...currentOrg.settings,
				email: {
					...currentOrg.settings?.email,
					defaultFromSignatureId: args.input.defaultFromSignatureId
				}
			},
			updatedAt: new Date()
		})
		.where(eq(organization.id, args.metadata.organizationId))
		.returning();
	if (!result) {
		throw new Error('Failed to set default signature');
	}
	return result;
}

export async function updateSystemFromIdentity({
	tx,
	ctx,
	args
}: {
	tx: ServerTransaction;
	ctx: QueryContext;
	args: UpdateSystemFromIdentityMutatorSchemaZero;
}) {
	if (args.input.name === undefined && args.input.replyTo === undefined) {
		throw new Error('Name or reply to is required');
	}
	const [currentOrg] = await tx.dbTransaction.wrappedTransaction
		.select()
		.from(organization)
		.where(eq(organization.id, args.metadata.organizationId))
		.limit(1);

	if (!currentOrg) {
		throw new Error('Organization not found');
	}

	await tx.dbTransaction.wrappedTransaction
		.update(organization)
		.set({
			settings: {
				...currentOrg.settings,
				email: {
					...currentOrg.settings?.email,
					systemFromIdentity: {
						...currentOrg.settings?.email?.systemFromIdentity,
						...args.input
					}
				}
			},
			updatedAt: new Date()
		})
		.where(eq(organization.id, args.metadata.organizationId));
}
