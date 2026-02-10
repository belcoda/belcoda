import { organization as orgTable, emailFromSignature } from '$lib/schema/drizzle';
import { env as publicEnv } from '$env/dynamic/public';
const { PUBLIC_POSTMARK_SENDING_DOMAIN } = publicEnv;
const postmarkSendingDomain = PUBLIC_POSTMARK_SENDING_DOMAIN || 'belcoda.com';
import { drizzle } from '$lib/server/db';
import { eq } from 'drizzle-orm';
export async function getEmailSignature({
	emailFromSignatureId,
	organization
}: {
	emailFromSignatureId?: string | null;
	organization: typeof orgTable.$inferSelect;
}) {
	if (!emailFromSignatureId) {
		return {
			name: organization.settings.email.systemFromIdentity.name || organization.name,
			replyTo: organization.settings.email.systemFromIdentity.replyTo,
			emailAddress: `${organization.slug}@${postmarkSendingDomain}`
		};
	}
	const emailSignature = await db.query.emailFromSignature.findFirst({
		where: eq(emailFromSignature.id, emailFromSignatureId)
	});
	if (!emailSignature) {
		throw new Error('Email signature not found');
	}
	return {
		name: emailSignature.name,
		replyTo: emailSignature.replyTo,
		emailAddress: emailSignature.emailAddress
	};
}
