import type { ServerTransaction } from '@rocicorp/zero';
import { type QueryContext, builder } from '$lib/zero/schema';

import {
	member,
	person,
	personNote,
	personNoteMention,
	personTeam,
	team,
	teamMember,
	user
} from '$lib/schema/drizzle';
import { personNoteReadPermissions } from '$lib/zero/query/person_note/permissions';
import { eq, and, isNull, count, ilike, inArray } from 'drizzle-orm';

import { parse } from 'valibot';
import {
	createMutatorSchemaZero,
	type CreateMutatorSchemaZero,
	updateMutatorSchemaZero,
	type UpdateMutatorSchemaZero,
	deleteMutatorSchemaZero,
	type DeleteMutatorSchemaZero,
	personNoteApiSchema
} from '$lib/schema/person-note';
import type { WritePersonNoteMentionZero } from '$lib/schema/person-note-mention';

import { getPerson } from '$lib/server/api/data/person/person';
import { getOrganizationMember } from '$lib/server/api/data/organization/member';
import type { ListFilter } from '$lib/schema/helpers';
import { listPersonNotesQuery } from '$lib/zero/query/person_note/list';
import { getQueue, queueSendOptionsFromTransaction } from '$lib/server/queue';
import { createNotification } from '$lib/server/api/data/notification/notification';
import { buildPersonNoteMentionNotifications } from '$lib/utils/person-note/notifications';

async function requireMentionedUsersCanReadPerson({
	tx,
	organizationId,
	personId,
	mentions
}: {
	tx: ServerTransaction;
	organizationId: string;
	personId: string;
	mentions: readonly WritePersonNoteMentionZero[];
}) {
	const mentionedUserIds = [...new Set(mentions.map((mention) => mention.mentionedUserId))];
	if (mentionedUserIds.length === 0) return;

	const memberships = await tx.dbTransaction.wrappedTransaction
		.select({ userId: member.userId, role: member.role })
		.from(member)
		.where(
			and(eq(member.organizationId, organizationId), inArray(member.userId, mentionedUserIds))
		);
	if (memberships.length !== mentionedUserIds.length) {
		throw new Error('Every mentioned user must be a member of the organization');
	}

	const usersWithOrganizationWideRead = new Set(
		memberships
			.filter((membership) => membership.role === 'admin' || membership.role === 'owner')
			.map((membership) => membership.userId)
	);
	const usersNeedingTeamAccess = mentionedUserIds.filter(
		(userId) => !usersWithOrganizationWideRead.has(userId)
	);
	if (usersNeedingTeamAccess.length === 0) {
		return;
	}

	const personTeams = await tx.dbTransaction.wrappedTransaction
		.select({ teamId: personTeam.teamId })
		.from(personTeam)
		.where(and(eq(personTeam.organizationId, organizationId), eq(personTeam.personId, personId)));
	if (personTeams.length === 0) {
		throw new Error('Every mentioned user must be able to read the person');
	}

	const personTeamIds = new Set(personTeams.map((row) => row.teamId));
	const organizationTeams = await tx.dbTransaction.wrappedTransaction
		.select({ id: team.id, parentTeamId: team.parentTeamId })
		.from(team)
		.where(eq(team.organizationId, organizationId));
	const organizationTeamIds = organizationTeams.map((organizationTeam) => organizationTeam.id);
	if (organizationTeamIds.length === 0) {
		throw new Error('Every mentioned user must be able to read the person');
	}

	const teamMemberships = await tx.dbTransaction.wrappedTransaction
		.select({ userId: teamMember.userId, teamId: teamMember.teamId })
		.from(teamMember)
		.where(
			and(
				inArray(teamMember.userId, usersNeedingTeamAccess),
				inArray(teamMember.teamId, organizationTeamIds)
			)
		);

	const childTeamsByParentId = new Map<string, string[]>();
	for (const organizationTeam of organizationTeams) {
		if (!organizationTeam.parentTeamId) continue;
		const children = childTeamsByParentId.get(organizationTeam.parentTeamId) ?? [];
		children.push(organizationTeam.id);
		childTeamsByParentId.set(organizationTeam.parentTeamId, children);
	}

	const directTeamIdsByUserId = new Map<string, string[]>();
	for (const teamMembership of teamMemberships) {
		const directTeamIds = directTeamIdsByUserId.get(teamMembership.userId) ?? [];
		directTeamIds.push(teamMembership.teamId);
		directTeamIdsByUserId.set(teamMembership.userId, directTeamIds);
	}

	const usersWithPersonReadAccess = new Set(usersWithOrganizationWideRead);
	for (const userId of usersNeedingTeamAccess) {
		const queue = [...(directTeamIdsByUserId.get(userId) ?? [])];
		const visitedTeamIds = new Set(queue);

		for (let index = 0; index < queue.length; index++) {
			const teamId = queue[index];
			if (personTeamIds.has(teamId)) {
				usersWithPersonReadAccess.add(userId);
				break;
			}
			for (const childTeamId of childTeamsByParentId.get(teamId) ?? []) {
				if (visitedTeamIds.has(childTeamId)) continue;
				visitedTeamIds.add(childTeamId);
				queue.push(childTeamId);
			}
		}
	}

	if (usersWithPersonReadAccess.size !== mentionedUserIds.length) {
		throw new Error('Every mentioned user must be able to read the person');
	}
}

export async function createPersonNote({
	tx,
	ctx,
	args
}: {
	tx: ServerTransaction;
	ctx: QueryContext & { userId: string }; // we want to make sure the userId is set here. Creating a person note is a user action and should not be allowed via the API
	args: CreateMutatorSchemaZero;
}) {
	const parsed = parse(createMutatorSchemaZero, args);

	//throws an error if the user is not a member of the organization
	await getOrganizationMember({
		tx,
		args: { organizationId: parsed.metadata.organizationId, userId: ctx.userId }
	});

	//make sure the person exists and has permissions
	const personRecord = await getPerson({
		tx,
		ctx,
		args: { organizationId: parsed.metadata.organizationId, personId: parsed.metadata.personId }
	});
	await requireMentionedUsersCanReadPerson({
		tx,
		organizationId: parsed.metadata.organizationId,
		personId: parsed.metadata.personId,
		mentions: parsed.input.mentions
	});
	const personNoteToCreate: typeof personNote.$inferInsert = {
		id: args.metadata.personNoteId,
		organizationId: args.metadata.organizationId,
		personId: args.metadata.personId,
		note: args.input.note,
		userId: ctx.userId,
		createdAt: new Date(),
		updatedAt: new Date()
	};

	const [result] = await tx.dbTransaction.wrappedTransaction
		.insert(personNote)
		.values(personNoteToCreate)
		.returning();
	if (!result) {
		throw new Error('Unable to create person note');
	}
	if (parsed.input.mentions.length > 0) {
		await tx.dbTransaction.wrappedTransaction.insert(personNoteMention).values(
			parsed.input.mentions.map((mention) => ({
				...mention,
				personNoteId: result.id,
				createdAt: new Date()
			}))
		);
		await createPersonNoteMentionNotifications({
			tx,
			organizationId: parsed.metadata.organizationId,
			personNoteId: result.id,
			personId: result.personId,
			personName: getPersonName(personRecord),
			noteAuthorUserId: ctx.userId,
			note: result.note,
			mentions: parsed.input.mentions
		});
	}
	const queue = await getQueue();
	queue.insertActivity({
		organizationId: args.metadata.organizationId,
		personId: result.personId,
		userId: ctx.userId,
		type: 'note_added',
		referenceId: args.metadata.personNoteId,
		unread: false
	});
	await queue.triggerWebhook(
		{
			organizationId: args.metadata.organizationId,
			payload: {
				type: 'person.note.created',
				data: parse(personNoteApiSchema, result)
			}
		},
		queueSendOptionsFromTransaction(tx)
	);

	return result;
}

export async function updatePersonNote({
	tx,
	ctx,
	args
}: {
	tx: ServerTransaction;
	ctx: QueryContext;
	args: UpdateMutatorSchemaZero;
}) {
	const parsed = parse(updateMutatorSchemaZero, args);
	const personNoteRecord = await tx.run(
		builder.personNote
			.where('id', '=', parsed.metadata.personNoteId)
			.where('organizationId', '=', parsed.metadata.organizationId)
			.where((expr) => personNoteReadPermissions(expr, ctx))
			.one()
	);
	if (!personNoteRecord) {
		throw new Error('Person note not found');
	}
	await requireMentionedUsersCanReadPerson({
		tx,
		organizationId: parsed.metadata.organizationId,
		personId: personNoteRecord.personId,
		mentions: parsed.input.mentions
	});
	const result = await _updatePersonNoteNoPermissionsCheckUnsafe({
		tx,
		personId: personNoteRecord.personId,
		noteId: parsed.metadata.personNoteId,
		organizationId: parsed.metadata.organizationId,
		note: parsed.input.note,
		mentions: parsed.input.mentions,
		mentionAuthorUserId: ctx.userId ?? undefined
	});
	return result;
}

export async function _updatePersonNoteNoPermissionsCheckUnsafe({
	tx,
	noteId,
	organizationId,
	personId,
	note,
	mentions,
	mentionAuthorUserId
}: {
	tx: ServerTransaction;
	noteId: string;
	personId: string;
	organizationId: string;
	note: string;
	mentions?: readonly WritePersonNoteMentionZero[];
	mentionAuthorUserId?: string;
}) {
	const [result] = await tx.dbTransaction.wrappedTransaction
		.update(personNote)
		.set({
			note: note,
			updatedAt: new Date()
		})
		.where(
			and(
				eq(personNote.personId, personId),
				eq(personNote.id, noteId),
				eq(personNote.organizationId, organizationId),
				isNull(personNote.deletedAt)
			)
		)
		.returning();
	if (!result) {
		throw new Error('Unable to update person note');
	}
	if (mentions !== undefined) {
		await tx.dbTransaction.wrappedTransaction
			.delete(personNoteMention)
			.where(eq(personNoteMention.personNoteId, noteId));
		if (mentions.length > 0) {
			await tx.dbTransaction.wrappedTransaction.insert(personNoteMention).values(
				mentions.map((mention) => ({
					...mention,
					personNoteId: noteId,
					createdAt: new Date()
				}))
			);
			if (mentionAuthorUserId) {
				await createPersonNoteMentionNotifications({
					tx,
					organizationId,
					personNoteId: noteId,
					personId,
					personName: await _getPersonNameByIdUnsafe({ tx, personId }),
					noteAuthorUserId: mentionAuthorUserId,
					note: result.note,
					mentions
				});
			}
		}
	}
	const queue = await getQueue();
	await queue.triggerWebhook(
		{
			organizationId: organizationId,
			payload: {
				type: 'person.note.updated',
				data: parse(personNoteApiSchema, result)
			}
		},
		queueSendOptionsFromTransaction(tx)
	);
	return result;
}

async function createPersonNoteMentionNotifications({
	tx,
	organizationId,
	personNoteId,
	personId,
	personName,
	noteAuthorUserId,
	note,
	mentions
}: {
	tx: ServerTransaction;
	organizationId: string;
	personNoteId: string;
	personId: string;
	personName: string | null;
	noteAuthorUserId: string;
	note: string;
	mentions: readonly WritePersonNoteMentionZero[];
}) {
	const [noteAuthor] = await tx.dbTransaction.wrappedTransaction
		.select({ name: user.name })
		.from(user)
		.where(eq(user.id, noteAuthorUserId))
		.limit(1);

	for (const args of buildPersonNoteMentionNotifications({
		organizationId,
		personNoteId,
		personId,
		personName,
		noteAuthorUserId,
		noteAuthorName: noteAuthor?.name ?? null,
		note,
		mentions
	})) {
		await createNotification({ tx, args });
	}
}

async function _getPersonNameByIdUnsafe({
	tx,
	personId
}: {
	tx: ServerTransaction;
	personId: string;
}) {
	const [personRecord] = await tx.dbTransaction.wrappedTransaction
		.select({ givenName: person.givenName, familyName: person.familyName })
		.from(person)
		.where(eq(person.id, personId))
		.limit(1);
	return getPersonName(personRecord);
}

function getPersonName(
	personRecord: { givenName: string | null; familyName: string | null } | undefined
) {
	return [personRecord?.givenName, personRecord?.familyName].filter(Boolean).join(' ') || null;
}

export async function deletePersonNote({
	tx,
	ctx,
	args
}: {
	tx: ServerTransaction;
	ctx: QueryContext;
	args: DeleteMutatorSchemaZero;
}) {
	const parsed = parse(deleteMutatorSchemaZero, args);
	const personNoteRecord = await tx.run(
		builder.personNote
			.where('id', '=', parsed.metadata.personNoteId)
			.where('organizationId', '=', parsed.metadata.organizationId)
			.where((expr) => personNoteReadPermissions(expr, ctx))
			.one()
	);
	if (!personNoteRecord) {
		throw new Error('Person note not found');
	}
	const [result] = await tx.dbTransaction.wrappedTransaction
		.update(personNote)
		.set({ deletedAt: new Date() })
		.where(
			and(
				eq(personNote.id, parsed.metadata.personNoteId),
				eq(personNote.organizationId, parsed.metadata.organizationId),
				isNull(personNote.deletedAt)
			)
		)
		.returning();
	if (!result) {
		throw new Error('Unable to delete person note');
	}
	const queue = await getQueue();
	await queue.triggerWebhook(
		{
			organizationId: parsed.metadata.organizationId,
			payload: {
				type: 'person.note.deleted',
				data: { personNoteId: parsed.metadata.personNoteId }
			}
		},
		queueSendOptionsFromTransaction(tx)
	);
}

export async function listPersonNotes({
	tx,
	ctx,
	input,
	personId
}: {
	tx: ServerTransaction;
	ctx: QueryContext;
	input: ListFilter;
	personId: string;
}) {
	const result = await tx.run(listPersonNotesQuery({ ctx, input: { ...input, personId } }));
	return result;
}

export async function _countPersonNotesUnsafe({
	tx,
	input,
	organizationId,
	personId
}: {
	tx: ServerTransaction;
	input: ListFilter;
	organizationId: string; //derived from ctx as opposed to provided by user
	personId: string;
}) {
	const filterArr = [
		eq(personNote.personId, personId),
		eq(personNote.organizationId, organizationId),
		isNull(personNote.deletedAt)
	];
	if (input.searchString) {
		filterArr.push(ilike(personNote.note, `%${input.searchString}%`));
	}
	const [result] = await tx.dbTransaction.wrappedTransaction
		.select({ count: count() })
		.from(personNote)
		.where(and(...filterArr));
	return result.count;
}
