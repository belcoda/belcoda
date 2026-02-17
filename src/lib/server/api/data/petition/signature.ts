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

import { type PersonActionHelper, personActionHelper } from '$lib/schema/person';
import { type PersonAddedFrom, personAddedFrom } from '$lib/schema/person/meta';
import {
	type PetitionSignatureDetails,
	petitionSignatureDetails
} from '$lib/schema/petition/settings';

import { parse } from 'valibot';

import { petition, petitionSignature, person, organization } from '$lib/schema/drizzle';
import { getOrganizationByIdUnsafe } from '$lib/server/api/data/organization';
import { eq, and } from 'drizzle-orm';
import { findOrCreatePerson } from '$lib/server/api/data/person/findOrCreate';
import { v7 as uuidv7 } from 'uuid';
import { getQueue } from '$lib/server/queue';

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
		teamId: petition.teamId,
		details: parsed.input.details,
		responses: parsed.input.responses,
		createdAt: new Date(),
		updatedAt: new Date()
	};

	const [result] = await tx.dbTransaction.wrappedTransaction
		.insert(petitionSignature)
		.values(petitionSignatureRecord)
		.returning();

	const queue = await getQueue();
	await queue.insertActivity({
		organizationId: parsed.metadata.organizationId,
		personId: parsed.metadata.personId,
		userId: ctx.userId || undefined,
		type: 'petition_signed',
		referenceId: parsed.metadata.petitionSignatureId,
		unread: false
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
	organizationId
}: {
	tx: ServerTransaction;
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
	tx: ServerTransaction;
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
