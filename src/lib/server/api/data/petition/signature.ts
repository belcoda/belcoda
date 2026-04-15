import type { ServerTransaction } from '@rocicorp/zero';
import { type QueryContext, builder } from '$lib/zero/schema';

import {
	createMutatorSchema,
	type CreateMutatorSchemaOutput,
	updateMutatorSchema,
	type UpdateMutatorSchemaOutput,
	deleteMutatorSchema,
	type DeleteMutatorSchemaOutput
} from '$lib/schema/petition/petition-signature';

import { organizationReadPermissions } from '$lib/zero/query/organizations/permissions';
import { personReadPermissions } from '$lib/zero/query/person/permissions';
import { petitionReadPermissions } from '$lib/zero/query/petition/permissions';
import { petitionSignatureReadPermissions } from '$lib/zero/query/petition_signature/permissions';
import { surveyResponsesSchema } from '$lib/schema/survey/responses';

import { type PersonActionHelper, personActionHelper } from '$lib/schema/person';
import {
	type PetitionSignatureDetails,
	petitionSignatureDetails
} from '$lib/schema/petition/settings';

import { parse, nullable } from 'valibot';

import { petition, petitionSignature, person, organization } from '$lib/schema/drizzle';
import { getOrganizationByIdUnsafe } from '$lib/server/api/data/organization';
import { eq, and, isNull } from 'drizzle-orm';
import { findOrCreatePerson } from '$lib/server/api/data/person/findOrCreate';
import { _getPersonByIdUnsafe } from '$lib/server/api/data/person/person';
import { applyTagToPersonUnsafe } from '$lib/server/api/data/person/tag';
import { petitionSettingsSchema } from '$lib/schema/petition/settings';
import { v7 as uuidv7 } from 'uuid';
import { getQueue } from '$lib/server/queue';
import { clampLocale } from '$lib/utils/language';
import { sendFlowMessage } from '$lib/server/utils/whatsapp/ycloud/ycloud_api';

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

	const petitionSignatureRecord: typeof petitionSignature.$inferInsert = {
		id: parsed.metadata.petitionSignatureId,
		organizationId: parsed.metadata.organizationId,
		petitionId: parsed.metadata.petitionId,
		personId: parsed.metadata.personId,
		teamId: petition.teamId ?? null,
		details: parsed.input.details,
		responses: parsed.input.responses,
		createdAt: new Date(),
		updatedAt: new Date()
	};

	const [result] = await tx.dbTransaction.wrappedTransaction
		.insert(petitionSignature)
		.values(petitionSignatureRecord)
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
		referenceId: parsed.metadata.petitionSignatureId,
		unread: false
	});

	await applyPetitionTagsToPersonUnsafe({
		tx,
		petitionSettings: petition.settings,
		personId: parsed.metadata.personId,
		organizationId: parsed.metadata.organizationId
	});
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
	const [result] = await tx.dbTransaction.wrappedTransaction
		.update(petitionSignature)
		.set({
			responses: args.input.responses,
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
	responses = null
}: {
	tx: ServerTransaction;
	petitionId: string;
	personAction: PersonActionHelper;
	signatureDetails: PetitionSignatureDetails;
	organizationId: string;
	teamId?: string;
	responses?: Record<string, unknown> | null;
	skipNotifications?: boolean;
}) {
	const parsedSignatureDetails = parse(petitionSignatureDetails, signatureDetails);
	const parsedActionHelper = parse(personActionHelper, personAction);
	const parsedResponses = parse(nullable(surveyResponsesSchema), responses);
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
		teamId
	});

	const organizationRecord = await getOrganizationByIdUnsafe({ organizationId, tx });

	const petitionSignatureResult = await signPetitionUnsafe({
		tx,
		petitionSignatureId,
		petitionRecord: petitionResult,
		personRecord: personRecord,
		organizationRecord: organizationRecord,
		details: parsedSignatureDetails,
		skipNotifications,
		responses: parsedResponses
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
	skipNotifications = false,
	responses = null
}: {
	petitionSignatureId?: string;
	tx: ServerTransaction;
	petitionRecord: typeof petition.$inferSelect;
	personRecord: typeof person.$inferSelect;
	organizationRecord: typeof organization.$inferSelect;
	details: PetitionSignatureDetails;
	responses?: Record<string, unknown> | null;
	skipNotifications?: boolean;
}) {
	const id = petitionSignatureId || uuidv7();
	const petitionSignatureRecord: typeof petitionSignature.$inferInsert = {
		id,
		organizationId: organizationRecord.id,
		teamId: petitionRecord.teamId,
		petitionId: petitionRecord.id,
		personId: personRecord.id,
		details,
		responses: responses ?? null,
		createdAt: new Date(),
		updatedAt: new Date()
	};

	const conflictSet: Partial<typeof petitionSignature.$inferInsert> = {
		details: petitionSignatureRecord.details,
		teamId: petitionRecord.teamId,
		updatedAt: new Date(),
		...(responses === null ? {} : { responses: petitionSignatureRecord.responses }) //strips responses if null, to avoid overwriting existing responses
	};

	const [insertedPetitionSignature] = await tx.dbTransaction.wrappedTransaction
		.insert(petitionSignature)
		.values(petitionSignatureRecord)
		.onConflictDoUpdate({
			target: [petitionSignature.petitionId, petitionSignature.personId],
			set: conflictSet,
			setWhere: and(isNull(petitionSignature.deletedAt))
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
		await queue.raw.send('sendPetitionSignatureConfirmation', {
			petitionSignatureId: id,
			locale
		});
	}
	await applyPetitionTagsToPersonUnsafe({
		tx,
		petitionSettings: petitionRecord.settings,
		personId: personRecord.id,
		organizationId: organizationRecord.id
	});
	//TODO: Implement whatsapp notification

	return insertedPetitionSignature;
}

export async function completePetitionSignatureHelper({
	petitionId,
	teamId,
	tx,
	personAction,
	signatureDetails,
	organizationId,
	responses = null,
	skipNotifications = true
}: {
	tx: ServerTransaction;
	petitionId: string;
	personAction: PersonActionHelper;
	signatureDetails: PetitionSignatureDetails;
	organizationId: string;
	teamId?: string;
	responses?: Record<string, unknown> | null;
	skipNotifications?: boolean;
}) {
	const result = await signPetitionHelper({
		petitionId,
		teamId,
		tx,
		personAction,
		signatureDetails,
		organizationId,
		skipNotifications,
		responses
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
	flowMessageTo
}: {
	tx: ServerTransaction;
	petitionId: string;
	organizationId: string;
	personAction: PersonActionHelper;
	signatureDetails: PetitionSignatureDetails;
	teamId?: string;
	flowMessageFrom: string;
	flowMessageTo: string;
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
		updateExistingPerson: true
	});

	const settings = parse(petitionSettingsSchema, petitionResult.settings ?? {});
	const flowId = settings.whatsappFlowId;

	if (flowId) {
		try {
			await sendFlowMessage({
				from: flowMessageFrom,
				to: flowMessageTo,
				flowId: flowId,
				flowCta: 'Sign',
				headerText: petitionResult.title,
				bodyText: `Complete the form to sign ${petitionResult.title}`,
				footerText: 'Tap to sign the petition'
			});
			return { flowSent: true as const, personId: personRecord.id };
		} catch (error) {
			return await completePetitionSignatureHelper({
				petitionId,
				teamId,
				tx,
				personAction,
				signatureDetails: parsedSignatureDetails,
				organizationId,
				responses: null,
				skipNotifications: true
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
		responses: null,
		skipNotifications: true
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
}
