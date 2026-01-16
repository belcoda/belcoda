import { env } from '$env/dynamic/private';
const { POSTMARK_ACCOUNT_TOKEN } = env;

import type {
	CreateEmailFromSignature,
	UpdateEmailFromSignature
} from '$lib/schema/email-from-signature';
import { object, optional, nullable, boolean, type InferOutput, parse } from 'valibot';
import { integer, email, mediumString, domainName, shortString } from '$lib/schema/helpers';
import pino from '$lib/pino';

const log = pino(import.meta.url);

export const postmarkReadSendSignatureBodySchema = object({
	ID: integer,
	EmailAddress: email,
	Name: mediumString,
	Confirmed: boolean(),
	ReturnPathDomain: optional(nullable(domainName)),
	ReturnPathDomainVerified: optional(nullable(boolean()))
});
export type PostmarkReadSendSignatureBody = InferOutput<typeof postmarkReadSendSignatureBodySchema>;

export const postmarkCreateSendSignatureBodySchema = object({
	FromEmail: email,
	ReplyToEmail: optional(email),
	Name: shortString,
	ReturnPathDomain: optional(nullable(domainName)),
	ConfirmationPersonalNote: optional(mediumString)
});
export type PostmarkCreateSendSignatureBody = InferOutput<
	typeof postmarkCreateSendSignatureBodySchema
>;

export const postmarkUpdateSendSignatureBodySchema = object({
	ReplyToEmail: optional(email),
	Name: optional(shortString)
});
export type PostmarkUpdateSendSignatureBody = InferOutput<
	typeof postmarkUpdateSendSignatureBodySchema
>;

export async function createSendSignature({
	organizationId,
	emailFromSignature
}: {
	organizationId: string;
	emailFromSignature: CreateEmailFromSignature;
}) {
	log.debug({ organizationId, emailFromSignature }, 'Creating send signature');
	const body: PostmarkCreateSendSignatureBody = {
		FromEmail: emailFromSignature.emailAddress,
		Name: emailFromSignature.name,
		ReturnPathDomain: emailFromSignature.returnPathDomain || undefined,
		ReplyToEmail: emailFromSignature.replyTo || undefined
	};
	const result = await fetch(`https://api.postmarkapp.com/senders`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'X-Postmark-Account-Token': POSTMARK_ACCOUNT_TOKEN
		},
		body: JSON.stringify(body)
	});
	if (!result.ok) {
		const errorBody = await result.json();
		log.error({ result: errorBody }, 'Failed to create send signature');
		throw new Error('Failed to create send signature');
	}
	const data = await result.json();
	log.debug({ data }, 'Created send signature');
	return parse(postmarkReadSendSignatureBodySchema, data);
}

export async function verifySendSignature({
	organizationId,
	emailSignatureExternalId
}: {
	organizationId: string;
	emailSignatureExternalId: number;
}) {
	log.debug({ organizationId, emailSignatureExternalId }, 'Verifying send signature');
	const result = await fetch(`https://api.postmarkapp.com/senders/${emailSignatureExternalId}`, {
		method: 'GET',
		headers: {
			'Content-Type': 'application/json',
			'X-Postmark-Account-Token': POSTMARK_ACCOUNT_TOKEN
		}
	});
	if (!result.ok) {
		const errorBody = await result.json();
		log.error({ result: errorBody }, 'Failed to verify send signature');
		throw new Error('Failed to verify send signature');
	}
	const data = await result.json();
	log.debug({ data }, 'Verified send signature');
	return parse(postmarkReadSendSignatureBodySchema, data);
}

export async function updateSendSignature({
	emailSignatureExternalId,
	signatureBody
}: {
	emailSignatureExternalId: number;
	signatureBody: PostmarkUpdateSendSignatureBody;
}) {
	log.debug({ emailSignatureExternalId, signatureBody }, 'Updating send signature');
	const result = await fetch(`https://api.postmarkapp.com/senders/${emailSignatureExternalId}`, {
		method: 'PUT',
		headers: {
			'Content-Type': 'application/json',
			'X-Postmark-Account-Token': POSTMARK_ACCOUNT_TOKEN
		},
		body: JSON.stringify(signatureBody)
	});
	if (!result.ok) {
		const errorBody = await result.json();
		log.error({ result: errorBody }, 'Failed to update send signature');
		throw new Error('Failed to update send signature');
	}
	const data = await result.json();
	log.debug({ data }, 'Updated send signature');
	return parse(postmarkReadSendSignatureBodySchema, data);
}
