import { db } from '$lib/server/db';
import { type ActivityType } from '$lib/schema/activity/types';
import { insertActivity as insertActivityData } from '$lib/server/api/data/activity/activity';
export async function insertActivity({
	organizationId,
	personId,
	userId,
	type,
	referenceId,
	unread
}: {
	organizationId: string;
	personId: string;
	type: ActivityType;
	userId?: string | null;
	referenceId: string;
	unread: boolean;
}) {
	await db.transaction(async (tx) => {
		await insertActivityData({
			organizationId,
			personId,
			userId,
			type,
			referenceId,
			unread,
			tx
		});
	});
}
