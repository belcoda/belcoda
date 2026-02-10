import { json, error } from '@sveltejs/kit';
import { verifySendSignature } from '$lib/server/api/utils/postmark';
import { drizzle } from '$lib/server/db';
import { emailFromSignature } from '$lib/schema/drizzle';
import { eq } from 'drizzle-orm';
import { getQueryContext } from '$lib/server/api/utils/auth/permissions';
import { emailFromSignatureReadPermissions } from '$lib/zero/query/email_from_signature/permissions';
import { builder } from '$lib/zero/schema';
import pino from '$lib/pino';

const log = pino(import.meta.url);

export async function PUT(event) {
	if (!event.locals.session?.user?.id) {
		return error(401, 'Unauthorized');
	}

	const userId = event.locals.session.user.id;
	const { fromSignatureId } = event.params;

	if (!fromSignatureId) {
		return error(400, 'Email from signature ID is required');
	}

	try {
		const ctx = await getQueryContext(userId);

		const emailFromSignatureRecord = await builder.emailFromSignature
			.where('id', '=', fromSignatureId)
			.where((expr) => emailFromSignatureReadPermissions(expr, ctx))
			.where('deletedAt', 'IS', null)
			.one()
			.run();

		if (!emailFromSignatureRecord) {
			return error(404, 'Email from signature not found');
		}

		// Check permissions
		if (![...ctx.adminOrgs, ...ctx.ownerOrgs].includes(emailFromSignatureRecord.organizationId)) {
			return error(403, 'You are not authorized to verify this email signature');
		}

		if (!emailFromSignatureRecord.externalId) {
			return error(
				400,
				'Email from signature is not referenced in external email provider. Only external signatures can be verified.'
			);
		}

		// Verify with Postmark
		const result = await verifySendSignature({
			organizationId: emailFromSignatureRecord.organizationId,
			emailSignatureExternalId: parseInt(emailFromSignatureRecord.externalId)
		});

		const verified = result.Confirmed === true;
		const returnPathDomainVerified = result.ReturnPathDomainVerified === true;

		// Update the database
		const [updated] = await db
			.update(emailFromSignature)
			.set({
				verified,
				returnPathDomainVerified,
				returnPathDomain: result.ReturnPathDomain || emailFromSignatureRecord.returnPathDomain,
				updatedAt: new Date()
			})
			.where(eq(emailFromSignature.id, fromSignatureId))
			.returning();

		if (!updated) {
			return error(500, 'Failed to update email from signature');
		}

		return json(updated);
	} catch (err) {
		log.error({ err, fromSignatureId }, 'Error verifying send signature');
		return error(500, 'Failed to verify send signature');
	}
}
