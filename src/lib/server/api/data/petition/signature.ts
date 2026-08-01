import type { ServerTransaction } from '@rocicorp/zero';
import { type QueryContext, builder } from '$lib/zero/schema';

import {
	createMutatorSchema,
	type CreateMutatorSchemaOutput,
	updateMutatorSchema,
	type UpdateMutatorSchemaOutput,
	deleteMutatorSchema,
	type DeleteMutatorSchemaOutput,
	petitionSignatureApiSchema
} from '$lib/schema/petition/petition-signature';

import { organizationReadPermissions } from '$lib/zero/query/organizations/permissions';
import { personReadPermissions } from '$lib/zero/query/person/permissions';
import { petitionReadPermissions } from '$lib/zero/query/petition/permissions';
import { petitionSignatureReadPermissions } from '$lib/zero/query/petition_signature/permissions';

import { type PersonActionHelper, personActionHelper } from '$lib/schema/person';
import {
	type PetitionSignatureDetails,
	petitionSignatureDetails
} from '$lib/schema/petition/settings';

import { parse } from 'valibot';

import { petition, petitionSignature, person, organization } from '$lib/schema/drizzle';
import { getOrganizationByIdUnsafe } from '$lib/server/api/data/organization';
import { eq, and, isNull, not, inArray, count as countRows } from 'drizzle-orm';
import {
	findOrCreatePerson,
	type WhatsappIdentityLookup
} from '$lib/server/api/data/person/findOrCreate';
import { _getPersonByIdUnsafe } from '$lib/server/api/data/person/person';
import { applyTagToPersonUnsafe } from '$lib/server/api/data/person/tag';
import { petitionSettingsSchema } from '$lib/schema/petition/settings';
import { v7 as uuidv7 } from 'uuid';
import { getQueue, queueSendOptionsFromTransaction } from '$lib/server/queue';
import { clampLocale } from '$lib/utils/language';

import {
	inputSchema as listPetitionSignaturesInputSchema,
	listPetitionSignaturesQuery
} from '$lib/zero/query/petition_signature/list';
import { readPetitionSignatureQuery } from '$lib/zero/query/petition_signature/read';
import type { InferOutput } from 'valibot';
import { sendFlowMessage } from '$lib/server/utils/whatsapp/ycloud/ycloud_api';
import { createWhatsAppMessage } from '../whatsapp/message';
import { createNotification } from '$lib/server/api/data/notification/notification';

async function applyPetitionTagsToPersonUnsafe({
	tx,
	petitionSettings,
	personId,
	organizationId
}: {
	tx: ServerTransaction;
	petitionSettings: unknown;
	personId: string;
	organizationId: string;
}) {
	const settings = parse(petitionSettingsSchema, petitionSettings ?? {});
	for (const tagId of settings.tags) {
		await applyTagToPersonUnsafe({
			tx,
			personId,
			tagId,
			organizationId
		});
	}
}

/**
 * Merge an incoming signature `details` into an existing one on upsert/resume: keep the original
 * channel and shallow-merge custom fields so partial/resumed signatures don't clobber previously
 * captured answers. Analogous to the event side's `mergeSignupDetails`.
 */
function mergeSignatureDetails(
	existing: PetitionSignatureDetails,
	incoming: PetitionSignatureDetails
): PetitionSignatureDetails {
	return {
		channel: existing.channel ?? incoming.channel,
		customFields: {
			...(existing.customFields || {}),
			...(incoming.customFields || {})
		}
	};
}

export async function createPetitionSignature({
	tx,
	ctx,
	args
}: {
	tx: ServerTransaction;
	ctx: QueryContext;
	args: CreateMutatorSchemaOutput;
}) {
	const parsed = parse(createMutatorSchema, args);
	const organization = await tx.run(
		builder.organization
			.where((expr) => organizationReadPermissions(expr, ctx))
			.where('id', parsed.metadata.organizationId)
			.one()
	);
	if (!organization) {
		throw new Error('Organization not found');
	}
	const person = await tx.run(
		builder.person
			.where((expr) => personReadPermissions(expr, ctx))
			.where('id', parsed.metadata.personId)
			.one()
	);
	if (!person) {
		throw new Error('Person not found');
	}
	const petition = await tx.run(
		builder.petition
			.where((expr) => petitionReadPermissions(expr, ctx))
			.where('id', parsed.metadata.petitionId)
			.one()
	);
	if (!petition) {
		throw new Error('Petition not found');
	}

	// A previous (soft-deleted) signature may exist for this (petitionId, personId)
	// pair. The unique constraint `petition_signature_unique` does not consider
	// `deletedAt`, so a bare insert would fail. Use upsert: if an existing row is
	// found, re-activate it by clearing `deletedAt` and refreshing mutable fields.
	const [existingSignature] = await tx.dbTransaction.wrappedTransaction
		.select({
			id: petitionSignature.id,
			deletedAt: petitionSignature.deletedAt,
			details: petitionSignature.details
		})
		.from(petitionSignature)
		.where(
			and(
				eq(petitionSignature.petitionId, parsed.metadata.petitionId),
				eq(petitionSignature.personId, parsed.metadata.personId)
			)
		)
		.limit(1);

	// Merge custom fields onto any existing (active) details so we don't clobber previously
	// captured answers. If the existing row is soft-deleted, reactivation starts fresh from
	// the incoming details rather than resurrecting stale data from the deleted signature.
	const detailsToPersist =
		existingSignature && existingSignature.deletedAt == null
			? mergeSignatureDetails(existingSignature.details, parsed.input.details)
			: parsed.input.details;

	const petitionSignatureRecord: typeof petitionSignature.$inferInsert = {
		id: parsed.metadata.petitionSignatureId,
		organizationId: parsed.metadata.organizationId,
		petitionId: parsed.metadata.petitionId,
		personId: parsed.metadata.personId,
		teamId: petition.teamId ?? null,
		details: detailsToPersist,
		createdAt: new Date(),
		updatedAt: new Date()
	};

	const [result] = await tx.dbTransaction.wrappedTransaction
		.insert(petitionSignature)
		.values(petitionSignatureRecord)
		.onConflictDoUpdate({
			target: [petitionSignature.petitionId, petitionSignature.personId],
			set: {
				teamId: petitionSignatureRecord.teamId,
				details: petitionSignatureRecord.details,
				deletedAt: null,
				updatedAt: new Date()
			}
		})
		.returning();
	if (!result) {
		throw new Error('Unable to create petition signature');
	}

	const queue = await getQueue();
	await queue.insertActivity({
		organizationId: parsed.metadata.organizationId,
		personId: parsed.metadata.personId,
		userId: ctx.userId || undefined,
		type: 'petition_signed',
		referenceId: result.id,
		unread: false
	});

	await applyPetitionTagsToPersonUnsafe({
		tx,
		petitionSettings: petition.settings,
		personId: parsed.metadata.personId,
		organizationId: parsed.metadata.organizationId
	});

	const { organizationId, ...sigWebhookData } = result;

	const reactivatingDeletedSignature = existingSignature && existingSignature.deletedAt != null;
	let webhookType: 'petition.signature.created' | 'petition.signature.updated' =
		'petition.signature.created';
	if (existingSignature) {
		webhookType = 'petition.signature.updated';
	}
	if (reactivatingDeletedSignature) {
		webhookType = 'petition.signature.created'; // we consider reactivating a deleted signature as a new signature
	}
	await queue.triggerWebhook(
		{
			organizationId,
			payload: {
				type: webhookType,
				data: parse(petitionSignatureApiSchema, sigWebhookData)
			}
		},
		queueSendOptionsFromTransaction(tx)
	);
	return result;
}

export async function updatePetitionSignature({
	tx,
	ctx,
	args
}: {
	tx: ServerTransaction;
	ctx: QueryContext;
	args: UpdateMutatorSchemaOutput;
}) {
	const parsed = parse(updateMutatorSchema, args);
	const petitionSignatureRecord = await tx.run(
		builder.petitionSignature
			.where((expr) => petitionSignatureReadPermissions(expr, ctx))
			.where('id', parsed.metadata.petitionSignatureId)
			.one()
	);
	if (!petitionSignatureRecord) {
		throw new Error('Petition signature not found');
	}
	// Merge the incoming details onto the existing ones so custom fields accumulate and the channel
	// is preserved (mirrors the upsert paths).
	const mergedDetails = mergeSignatureDetails(
		petitionSignatureRecord.details,
		parsed.input.details
	);
	const [result] = await tx.dbTransaction.wrappedTransaction
		.update(petitionSignature)
		.set({
			details: mergedDetails,
			updatedAt: new Date()
		})
		.where(
			and(
				eq(petitionSignature.id, args.metadata.petitionSignatureId),
				eq(petitionSignature.organizationId, args.metadata.organizationId)
			)
		)
		.returning();
	if (!result) {
		throw new Error('Unable to update petition signature');
	}
	const { organizationId, ...sigWebhookData } = result;
	const queue = await getQueue();
	await queue.triggerWebhook(
		{
			organizationId,
			payload: {
				type: 'petition.signature.updated',
				data: parse(petitionSignatureApiSchema, sigWebhookData)
			}
		},
		queueSendOptionsFromTransaction(tx)
	);
	return result;
}

export async function getPetitionByIdUnsafe({
	petitionId,
	organizationId,
	tx
}: {
	tx: ServerTransaction;
	petitionId: string;
	organizationId: string;
}) {
	const [petitionResult] = await tx.dbTransaction.wrappedTransaction
		.select()
		.from(petition)
		.where(and(eq(petition.id, petitionId), eq(petition.organizationId, organizationId)));
	if (!petitionResult) {
		throw new Error('Petition not found');
	}
	return petitionResult;
}

export async function getPetitionSignaturesByPetitionIdUnsafe({
	petitionId,
	organizationId,
	tx
}: {
	tx: ServerTransaction;
	petitionId: string;
	organizationId: string;
}) {
	const petitionSignatures = await tx.dbTransaction.wrappedTransaction
		.select()
		.from(petitionSignature)
		.where(
			and(
				eq(petitionSignature.petitionId, petitionId),
				eq(petitionSignature.organizationId, organizationId)
			)
		);
	return petitionSignatures;
}

export async function signPetitionHelper({
	petitionId,
	teamId,
	tx,
	personAction,
	signatureDetails,
	organizationId,
	skipNotifications = false,
	whatsappIdentity,
	whatsappContextWamidId
}: {
	tx: ServerTransaction;
	petitionId: string;
	personAction: PersonActionHelper;
	signatureDetails: PetitionSignatureDetails;
	organizationId: string;
	teamId?: string;
	skipNotifications?: boolean;
	whatsappIdentity?: WhatsappIdentityLookup;
	whatsappContextWamidId?: string;
}) {
	const parsedSignatureDetails = parse(petitionSignatureDetails, signatureDetails);
	const parsedActionHelper = parse(personActionHelper, personAction);
	const petitionResult = await getPetitionByIdUnsafe({ petitionId, organizationId, tx });
	if (!petitionResult) {
		throw new Error('Petition not found');
	}
	if (petitionResult.deletedAt != null || petitionResult.archivedAt != null) {
		throw new Error('Petition is archived or deleted');
	}
	if (!petitionResult.published) {
		throw new Error('Petition is not published');
	}

	const petitionSignatureId = uuidv7();

	const personRecord = await findOrCreatePerson({
		tx,
		personAction: parsedActionHelper,
		addedFrom: {
			type: 'added_from_petition',
			petitionSignatureId
		},
		organizationId,
		teamId,
		whatsappIdentity,
		whatsappContextWamidId
	});

	const organizationRecord = await getOrganizationByIdUnsafe({ organizationId, tx });

	const petitionSignatureResult = await signPetitionUnsafe({
		tx,
		petitionSignatureId,
		petitionRecord: petitionResult,
		personRecord: personRecord,
		organizationRecord: organizationRecord,
		details: parsedSignatureDetails,
		skipNotifications
	});
	return petitionSignatureResult;
}

export async function signPetitionWithId({
	tx,
	petitionId,
	personId,
	organizationId,
	signupDetails
}: {
	tx: ServerTransaction;
	petitionId: string;
	personId: string;
	organizationId: string;
	signupDetails: PetitionSignatureDetails;
}) {
	const parsedSignupDetails = parse(petitionSignatureDetails, signupDetails);

	const petitionResult = await getPetitionByIdUnsafe({ petitionId, organizationId, tx });
	if (!petitionResult.published) {
		throw new Error('Petition is not published');
	}
	if (petitionResult.deletedAt != null || petitionResult.archivedAt != null) {
		throw new Error('Petition is archived or deleted');
	}

	const personRecord = await _getPersonByIdUnsafe({ personId, organizationId, tx });
	if (!personRecord) {
		throw new Error('Person not found');
	}

	const organizationRecord = await getOrganizationByIdUnsafe({ organizationId, tx });

	return await signPetitionUnsafe({
		tx,
		petitionRecord: petitionResult,
		personRecord,
		organizationRecord,
		details: parsedSignupDetails
	});
}

export async function signPetitionUnsafe({
	petitionSignatureId,
	petitionRecord,
	personRecord,
	organizationRecord,
	tx,
	details,
	skipNotifications = false
}: {
	petitionSignatureId?: string;
	tx: ServerTransaction;
	petitionRecord: typeof petition.$inferSelect;
	personRecord: typeof person.$inferSelect;
	organizationRecord: typeof organization.$inferSelect;
	details: PetitionSignatureDetails;
	skipNotifications?: boolean;
}) {
	const id = petitionSignatureId || uuidv7();

	// A soft-deleted signature may still occupy the (petitionId, personId) unique slot (the
	// constraint ignores deletedAt), so look up any existing row regardless of deletedAt.
	const [existingPetitionSignature] = await tx.dbTransaction.wrappedTransaction
		.select()
		.from(petitionSignature)
		.where(
			and(
				eq(petitionSignature.petitionId, petitionRecord.id),
				eq(petitionSignature.personId, personRecord.id),
				eq(petitionSignature.organizationId, organizationRecord.id)
			)
		)
		.limit(1);

	// An active existing row is a resume: merge custom fields so partial signatures don't clobber
	// previously captured answers. A soft-deleted row is a fresh re-signature: start from the
	// incoming details and reactivate the row (clear deletedAt) so re-signing works on every channel.
	const hasActiveSignature =
		existingPetitionSignature != null && existingPetitionSignature.deletedAt == null;
	const detailsToPersist = hasActiveSignature
		? mergeSignatureDetails(existingPetitionSignature.details, details)
		: details;

	const petitionSignatureRecord: typeof petitionSignature.$inferInsert = {
		id,
		organizationId: organizationRecord.id,
		teamId: petitionRecord.teamId,
		petitionId: petitionRecord.id,
		personId: personRecord.id,
		details: detailsToPersist,
		createdAt: new Date(),
		updatedAt: new Date()
	};

	const conflictSet: Partial<typeof petitionSignature.$inferInsert> = {
		details: petitionSignatureRecord.details,
		teamId: petitionRecord.teamId,
		deletedAt: null, // re-activate a previously soft-deleted signature so re-signing works
		updatedAt: new Date()
	};

	const [insertedPetitionSignature] = await tx.dbTransaction.wrappedTransaction
		.insert(petitionSignature)
		.values(petitionSignatureRecord)
		.onConflictDoUpdate({
			target: [petitionSignature.petitionId, petitionSignature.personId],
			set: conflictSet
		})
		.returning();
	if (!insertedPetitionSignature) {
		throw new Error('Unable to create petition signature');
	}

	if (!skipNotifications && details.channel.type === 'petitionPage') {
		const queue = await getQueue();
		const locale = clampLocale(
			personRecord.preferredLanguage || organizationRecord.defaultLanguage
		);
		// Use pg-boss directly so enqueue works even if cached queue object predates a new handler export
		// Use the persisted row id (on upsert/reactivation the existing row keeps its original id).
		await queue.raw.send('sendPetitionSignatureConfirmation', {
			petitionSignatureId: insertedPetitionSignature.id,
			locale
		});
	}
	await applyPetitionTagsToPersonUnsafe({
		tx,
		petitionSettings: petitionRecord.settings,
		personId: personRecord.id,
		organizationId: organizationRecord.id
	});
	// Notify on a brand-new signature or a reactivation of a soft-deleted one — both are fresh signups.
	//
	// Known limitation (accepted for now): on reactivation the upserted row keeps its ORIGINAL id, so
	// `sourceKey` matches the notification written at the first signup. `createNotification` dedupes via
	// onConflictDoNothing on (organizationId, userId, sourceKey), and soft-deleting a signature does not
	// remove its notification, so re-signing after a delete produces NO new in-app notification. The
	// webhook (petition.signature.created) and confirmation email still fire, so re-signers/integrations
	// are covered. If re-notifying admins on re-sign becomes desired, add a reactivation discriminator to
	// the sourceKey (mind retry idempotency) or re-surface the existing notification to unread.
	if (!skipNotifications && !hasActiveSignature) {
		const personName =
			[personRecord.givenName, personRecord.familyName].filter(Boolean).join(' ') || null;
		await createNotification({
			tx,
			args: {
				type: 'petition_signup',
				organizationId: organizationRecord.id,
				referenceId: petitionRecord.id,
				sourceKey: `petition_signup:${insertedPetitionSignature.id}`,
				payload: {
					personName,
					personId: personRecord.id,
					subjectTitle: petitionRecord.title
				},
				routing: {
					creatorUserId: null,
					relatedResources: [
						{ referenceType: 'petition', referenceId: petitionRecord.id },
						{ referenceType: 'person', referenceId: personRecord.id }
					]
				}
			}
		});
	}

	const { organizationId, ...sigWebhookData } = insertedPetitionSignature;
	const queueSig = await getQueue();
	await queueSig.triggerWebhook(
		{
			organizationId,
			payload: {
				type: hasActiveSignature ? 'petition.signature.updated' : 'petition.signature.created',
				data: parse(petitionSignatureApiSchema, sigWebhookData)
			}
		},
		queueSendOptionsFromTransaction(tx)
	);

	return insertedPetitionSignature;
}

export async function completePetitionSignatureHelper({
	petitionId,
	teamId,
	tx,
	personAction,
	signatureDetails,
	organizationId,
	skipNotifications = true,
	whatsappIdentity,
	whatsappContextWamidId
}: {
	tx: ServerTransaction;
	petitionId: string;
	personAction: PersonActionHelper;
	signatureDetails: PetitionSignatureDetails;
	organizationId: string;
	teamId?: string;
	skipNotifications?: boolean;
	whatsappIdentity?: WhatsappIdentityLookup;
	whatsappContextWamidId?: string;
}) {
	const result = await signPetitionHelper({
		petitionId,
		teamId,
		tx,
		personAction,
		signatureDetails,
		organizationId,
		skipNotifications,
		whatsappIdentity,
		whatsappContextWamidId
	});
	const queue = await getQueue();
	await queue.insertActivity({
		organizationId,
		personId: result.personId,
		userId: undefined,
		type: 'petition_signed',
		referenceId: result.id,
		unread: false
	});
	return result;
}

export async function createIncompletePetitionSignatureHelper({
	petitionId,
	organizationId,
	tx,
	personAction,
	signatureDetails,
	teamId,
	flowMessageFrom,
	flowMessageTo,
	whatsappIdentity,
	whatsappContextWamidId
}: {
	tx: ServerTransaction;
	petitionId: string;
	organizationId: string;
	personAction: PersonActionHelper;
	signatureDetails: PetitionSignatureDetails;
	teamId?: string;
	flowMessageFrom: string;
	flowMessageTo: string;
	whatsappIdentity?: WhatsappIdentityLookup;
	whatsappContextWamidId?: string;
}) {
	const petitionResult = await getPetitionByIdUnsafe({ petitionId, organizationId, tx });
	if (!petitionResult.published) {
		throw new Error('Petition is not published');
	}
	if (petitionResult.deletedAt != null || petitionResult.archivedAt != null) {
		throw new Error('Petition is archived or deleted');
	}

	const parsedSignatureDetails = parse(petitionSignatureDetails, signatureDetails);
	const parsedActionHelper = parse(personActionHelper, personAction);
	const petitionSignatureId = uuidv7();

	const personRecord = await findOrCreatePerson({
		tx,
		personAction: parsedActionHelper,
		addedFrom: {
			type: 'added_from_petition',
			petitionSignatureId
		},
		organizationId,
		teamId: teamId ?? petitionResult.teamId ?? undefined,
		updateExistingPerson: true,
		whatsappIdentity,
		whatsappContextWamidId
	});

	const settings = parse(petitionSettingsSchema, petitionResult.settings ?? {});
	const flowId = settings.whatsappFlowId;

	if (flowId) {
		try {
			const responseId = await sendFlowMessage({
				from: flowMessageFrom,
				to: flowMessageTo,
				flowId: flowId,
				flowCta: 'Sign',
				headerText: petitionResult.title,
				bodyText: `Complete the form to sign ${petitionResult.title}`,
				footerText: 'Tap to sign the petition'
			});
			// create a whatsapp message record in the database because we want to be able to track the reply to this message to infer a personId
			// note: in other message types, the createWhatsAppMessage function is called on the outbound message sending utility, but we don't want to add that to flows...
			await createWhatsAppMessage({
				id: uuidv7(),
				organizationId: organizationId,
				externalId: responseId,
				personId: personRecord.id,
				message: { id: responseId, emojiReactions: [] },
				type: 'outbound_api_message:system-flow',
				tx
			});
			return { flowSent: true as const, personId: personRecord.id };
		} catch {
			return await completePetitionSignatureHelper({
				petitionId,
				teamId,
				tx,
				personAction,
				signatureDetails: parsedSignatureDetails,
				organizationId,
				skipNotifications: true,
				whatsappIdentity,
				whatsappContextWamidId
			});
		}
	}

	return await completePetitionSignatureHelper({
		petitionId,
		teamId,
		tx,
		personAction,
		signatureDetails: parsedSignatureDetails,
		organizationId,
		skipNotifications: true,
		whatsappIdentity,
		whatsappContextWamidId
	});
}

export async function deletePetitionSignature({
	tx,
	ctx,
	args
}: {
	tx: ServerTransaction;
	ctx: QueryContext;
	args: DeleteMutatorSchemaOutput;
}) {
	const parsed = parse(deleteMutatorSchema, args);
	const petitionSignatureRecord = await tx.run(
		builder.petitionSignature
			.where('id', '=', parsed.metadata.petitionSignatureId)
			.where('organizationId', '=', parsed.metadata.organizationId)
			.where((expr) => petitionSignatureReadPermissions(expr, ctx))
			.one()
	);
	if (!petitionSignatureRecord) {
		throw new Error('Petition signature not found');
	}

	await tx.dbTransaction.wrappedTransaction
		.update(petitionSignature)
		.set({
			deletedAt: new Date(),
			updatedAt: new Date()
		})
		.where(
			and(
				eq(petitionSignature.id, parsed.metadata.petitionSignatureId),
				eq(petitionSignature.organizationId, parsed.metadata.organizationId)
			)
		);
	const queue = await getQueue();
	await queue.triggerWebhook(
		{
			organizationId: petitionSignatureRecord.organizationId,
			payload: {
				type: 'petition.signature.deleted',
				data: { petitionSignatureId: parsed.metadata.petitionSignatureId }
			}
		},
		queueSendOptionsFromTransaction(tx)
	);
}

export async function listPetitionSignaturesForOrg({
	tx,
	ctx,
	input
}: {
	tx: ServerTransaction;
	ctx: QueryContext;
	input: InferOutput<typeof listPetitionSignaturesInputSchema>;
}) {
	return await tx.run(listPetitionSignaturesQuery({ ctx, input }));
}

export async function countPetitionSignaturesForOrg({
	tx,
	input
}: {
	tx: ServerTransaction;
	input: InferOutput<typeof listPetitionSignaturesInputSchema>;
}) {
	if (!input.petitionId) {
		throw new Error('petitionId is required');
	}
	const whereParts = [
		eq(petitionSignature.organizationId, input.organizationId),
		eq(petitionSignature.petitionId, input.petitionId),
		isNull(petitionSignature.deletedAt)
	];
	if (input.teamId) {
		whereParts.push(eq(petitionSignature.teamId, input.teamId));
	}
	if (input.personId) {
		whereParts.push(eq(petitionSignature.personId, input.personId));
	}
	if (input.excludedIds.length > 0) {
		whereParts.push(not(inArray(petitionSignature.id, input.excludedIds)));
	}
	const whereClause = and(...whereParts);
	const [result] = await tx.dbTransaction.wrappedTransaction
		.select({ count: countRows() })
		.from(petitionSignature)
		.where(whereClause);
	return result!.count;
}

export async function getPetitionSignatureForApi({
	tx,
	ctx,
	args
}: {
	tx: ServerTransaction;
	ctx: QueryContext;
	args: { petitionSignatureId: string };
}) {
	const row = await tx.run(readPetitionSignatureQuery({ ctx, input: args }));
	if (!row) {
		throw new Error('Petition signature not found');
	}
	return row;
}
