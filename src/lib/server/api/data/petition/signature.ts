import { type PersonActionHelper, personActionHelper } from '$lib/schema/person';
import { type PersonAddedFrom, personAddedFrom } from '$lib/schema/person/meta';
import { type PetitionSignatureDetails, petitionSignatureDetails } from '$lib/schema/petition/settings';

import { parse } from 'valibot';

import { petition, petitionSignature, person, organization } from '$lib/schema/drizzle';
import { getOrganizationByIdUnsafe } from '$lib/server/api/data/organization';
import { eq, and } from 'drizzle-orm';
import type { Transaction } from '$lib/server/db/zeroDrizzle';
import { findOrCreatePerson } from '$lib/server/api/data/person/findOrCreate';
import { v7 as uuidv7 } from 'uuid';
import { getQueue } from '$lib/server/queue';
import { clampLocale } from '$lib/utils/language';

export async function getPetitionByIdUnsafe({
	petitionId,
	organizationId,
	tx
}: {
	tx: Transaction;
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
	tx: Transaction;
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
	organizationId
}: {
	tx: Transaction;
	petitionId: string;
	personAction: PersonActionHelper;
	signatureDetails: PetitionSignatureDetails;
	organizationId: string;
	teamId?: string;
}) {
	const parsedSignatureDetails = parse(petitionSignatureDetails, signatureDetails);
	const parsedActionHelper = parse(personActionHelper, personAction);

	const petitionResult = await getPetitionByIdUnsafe({ petitionId, organizationId, tx });
	if (!petitionResult) {
		throw new Error('Petition not found');
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
		details: parsedSignatureDetails
	});
	return petitionSignatureResult;
}

export async function signPetitionUnsafe({
	petitionSignatureId,
	petitionRecord,
	personRecord,
	organizationRecord,
	tx,
	details
}: {
	petitionSignatureId?: string;
	tx: Transaction;
	petitionRecord: typeof petition.$inferSelect;
	personRecord: typeof person.$inferSelect;
	organizationRecord: typeof organization.$inferSelect;
	details: PetitionSignatureDetails;
}) {
	const id = petitionSignatureId || uuidv7();
	const petitionSignatureRecord: typeof petitionSignature.$inferInsert = {
		id,
		organizationId: organizationRecord.id,
		teamId: petitionRecord.teamId,
		petitionId: petitionRecord.id,
		personId: personRecord.id,
		details,
		responses: null,
		createdAt: new Date(),
		updatedAt: new Date()
	};

	const [insertedPetitionSignature] = await tx.dbTransaction.wrappedTransaction
		.insert(petitionSignature)
		.values(petitionSignatureRecord)
		.returning();
	if (!insertedPetitionSignature) {
		throw new Error('Unable to create petition signature');
	}

	if (details.channel.type === 'petitionPage') {
		// TODO: Send the signature confirmation notification
		// const queue = await getQueue();
		// queue.sendPetitionSignatureConfirmation({
		// 	petitionSignatureId: id,
		// 	locale: clampLocale(personRecord.preferredLanguage || organizationRecord.defaultLanguage)
		// });
	}
	//TODO: Implement whatsapp notification

	return insertedPetitionSignature;
}

