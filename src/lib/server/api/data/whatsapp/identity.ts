import { and, desc, eq, isNull, sql } from 'drizzle-orm';
import type { ServerTransaction } from '@rocicorp/zero';
import { v7 as uuidv7 } from 'uuid';

import pino from '$lib/pino';
import { organization, person, personWhatsappIdentity } from '$lib/schema/drizzle';
import type { IncomingMessageObject } from '$lib/schema/whatsapp/ycloud/incoming_message';
import { findOrCreatePerson } from '$lib/server/api/data/person/findOrCreate';
import {
	_findPersonByPhoneNumberUnsafe,
	_getPersonByIdUnsafe
} from '$lib/server/api/data/person/person';
import { _findWhatsAppMessageByWamidIdUnsafe } from '$lib/server/api/data/whatsapp/message';
import { normalizePhoneNumber, safeGetCountryCodeFromPhoneNumber } from '$lib/utils/phone';

const log = pino(import.meta.url);

export type ResolvedIncomingWhatsappIdentity = {
	organization: typeof organization.$inferSelect;
	person: typeof person.$inferSelect;
	identity?: typeof personWhatsappIdentity.$inferSelect;
	linkedSystemIdentity?: typeof personWhatsappIdentity.$inferSelect;
	waPhone: string;
	displayName: string;
	bsuid?: string;
	parentUserId?: string;
};

export type ResolvedOutboundWhatsappRecipient = {
	to?: string;
	recipient?: string;
};

export async function getOrganizationByWabaIdUnsafe({
	wabaId,
	tx
}: {
	wabaId: string;
	tx: ServerTransaction;
}) {
	const orgResult = await tx.dbTransaction.wrappedTransaction
		.select()
		.from(organization)
		.where(sql`${organization.settings}->'whatsApp'->>'wabaId' = ${wabaId}`);

	if (orgResult.length === 0) {
		log.warn({ wabaId }, 'Unable to resolve WhatsApp organization by WABA ID');
		throw new Error('No organization found for wabaId: ' + wabaId);
	}
	if (orgResult.length !== 1) {
		log.error(
			{ wabaId, organizationIds: orgResult.map((org) => org.id) },
			'Multiple organizations found for WABA ID'
		);
		throw new Error('Multiple organizations found for wabaId: ' + wabaId);
	}
	return orgResult[0];
}

export async function findWhatsappIdentityByBsuidUnsafe({
	organizationId,
	wabaId,
	bsuid,
	tx
}: {
	organizationId: string;
	wabaId: string;
	bsuid: string;
	tx: ServerTransaction;
}) {
	const [identity] = await tx.dbTransaction.wrappedTransaction
		.select()
		.from(personWhatsappIdentity)
		.where(
			and(
				isNull(personWhatsappIdentity.deletedAt),
				eq(personWhatsappIdentity.organizationId, organizationId),
				eq(personWhatsappIdentity.wabaId, wabaId),
				eq(personWhatsappIdentity.bsuid, bsuid)
			)
		);
	return identity;
}

export async function upsertWhatsappIdentityForPersonUnsafe({
	organizationId,
	personId,
	wabaId,
	bsuid,
	parentUserId,
	waPhone,
	displayName,
	tx
}: {
	organizationId: string;
	personId: string;
	wabaId: string;
	bsuid: string;
	parentUserId?: string | null;
	waPhone?: string | null;
	displayName?: string | null;
	tx: ServerTransaction;
}) {
	const now = new Date();

	const existingIdentity = await findWhatsappIdentityByBsuidUnsafe({
		organizationId,
		wabaId,
		bsuid,
		tx
	});

	const [upserted] = await tx.dbTransaction.wrappedTransaction
		.insert(personWhatsappIdentity)
		.values({
			id: uuidv7(),
			organizationId,
			personId,
			wabaId,
			bsuid,
			parentUserId: parentUserId ?? null,
			waPhone: waPhone ?? null,
			displayName: displayName ?? null,
			firstSeenAt: now,
			lastSeenAt: now,
			createdAt: now,
			updatedAt: now,
			deletedAt: null
		})
		.onConflictDoUpdate({
			target: [
				personWhatsappIdentity.organizationId,
				personWhatsappIdentity.wabaId,
				personWhatsappIdentity.bsuid
			],
			targetWhere: isNull(personWhatsappIdentity.deletedAt),
			set: {
				personId,
				parentUserId: sql`coalesce(excluded.parent_user_id, ${personWhatsappIdentity.parentUserId})`,
				waPhone: sql`coalesce(excluded.wa_phone, ${personWhatsappIdentity.waPhone})`,
				displayName: sql`coalesce(excluded.display_name, ${personWhatsappIdentity.displayName})`,
				lastSeenAt: now,
				updatedAt: now
			}
		})
		.returning();

	if (!upserted) {
		throw new Error('Failed to upsert WhatsApp identity');
	}

	if (existingIdentity && existingIdentity.personId !== personId) {
		log.warn(
			{
				organizationId,
				wabaId,
				bsuid,
				oldPersonId: existingIdentity.personId,
				newPersonId: personId
			},
			'Relinking WhatsApp BSUID identity to resolved person'
		);
	}

	return upserted;
}

export async function resolveIncomingWhatsappIdentity({
	inboundMessage,
	messageId,
	teamId,
	tx
}: {
	inboundMessage: IncomingMessageObject;
	messageId: string;
	teamId?: string;
	tx: ServerTransaction;
}): Promise<ResolvedIncomingWhatsappIdentity> {
	const organizationRecord = await getOrganizationByWabaIdUnsafe({
		wabaId: inboundMessage.wabaId,
		tx
	});
	const waPhone = inboundMessage.from;
	const displayName =
		inboundMessage.customerProfile?.name ??
		inboundMessage.customerProfile?.username ??
		inboundMessage.from;
	const bsuid = inboundMessage.fromUserId ?? undefined;
	const parentUserId = inboundMessage.fromParentUserId ?? undefined;

	if (!bsuid) {
		log.info(
			{
				organizationId: organizationRecord.id,
				wabaId: inboundMessage.wabaId,
				messageId,
				waPhone
			},
			'Inbound WhatsApp message has no BSUID; falling back to phone resolution'
		);
	}

	const identity = bsuid
		? await findWhatsappIdentityByBsuidUnsafe({
				organizationId: organizationRecord.id,
				wabaId: inboundMessage.wabaId,
				bsuid,
				tx
			})
		: undefined;

	let personRecord: typeof person.$inferSelect | undefined = undefined;
	if (identity) {
		try {
			personRecord = await _getPersonByIdUnsafe({
				personId: identity.personId,
				organizationId: organizationRecord.id,
				includeDeleted: false,
				tx
			});
		} catch (error) {
			log.info(
				{
					error,
					organizationId: organizationRecord.id,
					wabaId: inboundMessage.wabaId,
					bsuid,
					personId: identity.personId,
					messageId
				},
				'BSUID identity not found; falling back to phone/context resolution'
			);
		}
	}

	if (!personRecord && inboundMessage.context?.id) {
		try {
			const contextMessage = await _findWhatsAppMessageByWamidIdUnsafe({
				wamidId: inboundMessage.context.id,
				tx
			});
			if (contextMessage.organizationId === organizationRecord.id) {
				personRecord = await _getPersonByIdUnsafe({
					personId: contextMessage.personId,
					organizationId: organizationRecord.id,
					includeDeleted: false,
					tx
				});
			}
		} catch (error) {
			log.debug(
				{
					error,
					organizationId: organizationRecord.id,
					wabaId: inboundMessage.wabaId,
					contextWamidId: inboundMessage.context.id,
					messageId
				},
				'Unable to resolve inbound WhatsApp sender from context message'
			);
		}
	}

	if (!personRecord) {
		personRecord = await _findPersonByPhoneNumberUnsafe({
			organizationId: organizationRecord.id,
			phoneNumber: waPhone,
			tx
		});
	}

	if (!personRecord) {
		personRecord = await findOrCreatePerson({
			personAction: {
				phoneNumber: waPhone,
				givenName: displayName,
				country: safeGetCountryCodeFromPhoneNumber(waPhone) || organizationRecord.country,
				subscribed: false
			},
			teamId,
			addedFrom: { type: 'incoming_whatsapp_message', messageId },
			organizationId: organizationRecord.id,
			tx
		});
	}

	const linkedIdentity = bsuid
		? await upsertWhatsappIdentityForPersonUnsafe({
				organizationId: organizationRecord.id,
				personId: personRecord.id,
				wabaId: inboundMessage.wabaId,
				bsuid,
				parentUserId,
				waPhone,
				displayName,
				tx
			})
		: undefined;

	const linkedSystemIdentity =
		inboundMessage.type === 'system' && inboundMessage.system.user_id
			? await upsertWhatsappIdentityForPersonUnsafe({
					organizationId: organizationRecord.id,
					personId: personRecord.id,
					wabaId: inboundMessage.wabaId,
					bsuid: inboundMessage.system.user_id,
					parentUserId: inboundMessage.system.parent_user_id ?? null,
					waPhone: inboundMessage.system.wa_id,
					displayName,
					tx
				})
			: undefined;

	return {
		organization: organizationRecord,
		person: personRecord,
		identity: linkedIdentity,
		linkedSystemIdentity,
		waPhone,
		displayName,
		bsuid,
		parentUserId
	};
}

export async function resolveOutboundWhatsappRecipient({
	organizationId,
	wabaId,
	personId,
	phoneNumber,
	tx
}: {
	organizationId: string;
	wabaId?: string | null;
	personId: string;
	phoneNumber?: string | null;
	tx: ServerTransaction;
}): Promise<ResolvedOutboundWhatsappRecipient> {
	const recipient = wabaId
		? await findActiveWhatsappIdentityByPersonUnsafe({ organizationId, wabaId, personId, tx })
		: undefined;

	if (recipient?.bsuid) {
		const toPhone = phoneNumber?.trim() || recipient.waPhone?.trim() || undefined;
		return { recipient: recipient.bsuid, ...(toPhone ? { to: toPhone } : {}) };
	}

	const to = phoneNumber?.trim() || undefined;
	if (to) {
		const normalizedPhone = normalizePhoneNumber(to);
		if (normalizedPhone) {
			return { to: normalizedPhone };
		}
	}

	log.warn({ organizationId, wabaId, personId }, 'Unable to resolve outbound WhatsApp recipient');
	throw new Error('Person does not have a WhatsApp recipient or phone number');
}

async function findActiveWhatsappIdentityByPersonUnsafe({
	organizationId,
	wabaId,
	personId,
	tx
}: {
	organizationId: string;
	wabaId: string;
	personId: string;
	tx: ServerTransaction;
}) {
	const [identity] = await tx.dbTransaction.wrappedTransaction
		.select()
		.from(personWhatsappIdentity)
		.where(
			and(
				isNull(personWhatsappIdentity.deletedAt),
				eq(personWhatsappIdentity.organizationId, organizationId),
				eq(personWhatsappIdentity.wabaId, wabaId),
				eq(personWhatsappIdentity.personId, personId)
			)
		)
		.orderBy(desc(personWhatsappIdentity.lastSeenAt));
	return identity;
}
