import type { ServerTransaction } from '@rocicorp/zero';
import { type QueryContext, builder } from '$lib/zero/schema';
import { parse } from 'valibot';
import {
	addPersonTagMutatorSchemaZero,
	type AddPersonTagMutatorSchemaZero,
	type RemovePersonTagMutatorSchemaZero
} from '$lib/schema/person';
import { personReadPermissions } from '$lib/zero/query/person/permissions';
import { tagReadPermissions } from '$lib/zero/query/tag/permissions';
import { personTag, activity, tag } from '$lib/schema/drizzle';
import { eq, and, isNull } from 'drizzle-orm';
import { v7 as uuidv7 } from 'uuid';
import { updateLatestActivity } from '$lib/server/api/data/person/latestActivity';
import { getQueue } from '$lib/server/queue';
import { personTagApiSchema } from '$lib/schema/tag';
import { activityApiSchema } from '$lib/schema/activity';
import pino from '$lib/pino';
const log = pino(import.meta.url);

export async function addPersonTag({
	tx,
	ctx,
	args
}: {
	tx: ServerTransaction;
	ctx: QueryContext;
	args: AddPersonTagMutatorSchemaZero;
}) {
	const parsed = parse(addPersonTagMutatorSchemaZero, args);
	const personRecord = await tx.run(
		builder.person
			.where('id', '=', parsed.metadata.personId)
			.where('organizationId', '=', parsed.metadata.organizationId)
			.where((expr) => personReadPermissions(expr, ctx))
			.one()
	);
	if (!personRecord) {
		throw new Error('Person not found');
	}

	//make sure we have permissions for the tag
	const tagRecord = await tx.run(
		builder.tag
			.where('id', '=', args.metadata.tagId)
			.where('organizationId', '=', args.metadata.organizationId)
			.where((expr) => tagReadPermissions(expr, ctx))
			.one()
	);
	if (!tagRecord) {
		throw new Error('Tag not found');
	}

	const result = await _addPersonTagData({
		tx,
		args: {
			personId: args.metadata.personId,
			tagId: args.metadata.tagId,
			organizationId: args.metadata.organizationId
		}
	});
	return result;
}

export async function _addPersonTagData({
	tx,
	args
}: {
	tx: ServerTransaction;
	args: {
		personId: string;
		tagId: string;
		organizationId: string;
	};
}) {
	const tagRecord = await tx.dbTransaction.wrappedTransaction.query.tag.findFirst({
		where: and(eq(tag.id, args.tagId), eq(tag.organizationId, args.organizationId))
	});
	if (!tagRecord) {
		throw new Error('Tag not found');
	}
	const [result] = await tx.dbTransaction.wrappedTransaction
		.insert(personTag)
		.values({
			personId: args.personId,
			tagId: args.tagId,
			organizationId: args.organizationId,
			createdAt: new Date()
		})
		.returning();
	if (!result) {
		throw new Error('Unable to add person tag');
	}

	const [tagActivity] = await tx.dbTransaction.wrappedTransaction
		.insert(activity)
		.values({
			id: uuidv7(),
			type: 'tag_added',
			referenceId: args.tagId,
			unread: false,
			userId: null,
			organizationId: args.organizationId,
			createdAt: new Date(),
			personId: args.personId
		})
		.returning();

	await updateLatestActivity({
		tx,
		args: {
			personId: args.personId,
			organizationId: args.organizationId,
			activityPreview: {
				type: 'tag_added',
				tagName: tagRecord.name,
				tagId: args.tagId
			}
		}
	});

	if (tagActivity) {
		const { organizationId: actOrg, ...actData } = tagActivity;
		try {
			const actQueue = await getQueue();
			await actQueue.triggerWebhook({
				organizationId: actOrg,
				payload: {
					type: 'activity.created',
					data: parse(activityApiSchema, actData)
				}
			});
		} catch (err) {
			log.error({ err }, 'Failed to trigger webhook');
		}
	}
	try {
		const queue = await getQueue();
		await queue.triggerWebhook({
			organizationId: args.organizationId,
			payload: {
				type: 'tag.person.added',
				data: parse(personTagApiSchema, { personId: args.personId, tagId: args.tagId })
			}
		});
	} catch (err) {
		log.error({ err }, 'Failed to trigger webhook');
	}
	return result;
}

/**
 * Idempotent person–tag link for automated flows (e.g. event/petition signup).
 * Skips silently if the tag is missing, inactive, or soft-deleted.
 * Does not insert an `activity` row or call {@link updateLatestActivity} (unlike
 * {@link _addPersonTagData}) so bulk/automated tagging does not flood timelines.
 */
export async function applyTagToPersonUnsafe({
	tx,
	personId,
	tagId,
	organizationId
}: {
	tx: ServerTransaction;
	personId: string;
	tagId: string;
	organizationId: string;
}) {
	const db = tx.dbTransaction.wrappedTransaction;
	const tagRow = await db.query.tag.findFirst({
		where: and(
			eq(tag.id, tagId),
			eq(tag.organizationId, organizationId),
			eq(tag.active, true),
			isNull(tag.deletedAt)
		)
	});
	if (!tagRow) {
		return;
	}
	const [inserted] = await db
		.insert(personTag)
		.values({
			personId,
			tagId,
			organizationId,
			createdAt: new Date()
		})
		.onConflictDoNothing()
		.returning();
	if (inserted) {
		try {
			const queue = await getQueue();
			await queue.triggerWebhook({
				organizationId,
				payload: {
					type: 'tag.person.added',
					data: parse(personTagApiSchema, { personId, tagId })
				}
			});
		} catch (err) {
			log.error({ err }, 'Failed to trigger webhook');
		}
	}
}

export async function removePersonTag({
	tx,
	ctx,
	args
}: {
	tx: ServerTransaction;
	ctx: QueryContext;
	args: RemovePersonTagMutatorSchemaZero;
}) {
	if (
		!ctx.adminOrgs.includes(args.metadata.organizationId) &&
		!ctx.ownerOrgs.includes(args.metadata.organizationId)
	) {
		throw new Error('You are not authorized to remove a person from a tag in this organization');
	}
	const [result] = await tx.dbTransaction.wrappedTransaction
		.delete(personTag)
		.where(
			and(
				eq(personTag.personId, args.metadata.personId),
				eq(personTag.tagId, args.metadata.tagId),
				eq(personTag.organizationId, args.metadata.organizationId) // make sure the tag and person belongs to the organization
			)
		)
		.returning();
	if (result) {
		try {
			const queue = await getQueue();
			await queue.triggerWebhook({
				organizationId: args.metadata.organizationId,
				payload: {
					type: 'tag.person.removed',
					data: parse(personTagApiSchema, {
						personId: args.metadata.personId,
						tagId: args.metadata.tagId
					})
				}
			});
		} catch (err) {
			log.error({ err }, 'Failed to trigger webhook');
		}
	}
}
