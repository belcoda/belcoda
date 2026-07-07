import { drizzle } from '$lib/server/db';
import { user } from '$lib/schema/drizzle';
import { eq, sql } from 'drizzle-orm';
import {
	defaultUserSettings,
	type UserNotificationSettingsPatchSchema
} from '$lib/schema/user/settings';

export async function _getUserByIdUnsafe({ userId }: { userId: string }) {
	return drizzle.query.user.findFirst({
		where: eq(user.id, userId)
	});
}

export async function updateUserSettings({
	userId,
	notifications
}: {
	userId: string;
	notifications: UserNotificationSettingsPatchSchema;
}) {
	const defaultNotifications = JSON.stringify(defaultUserSettings().notifications);
	const notificationPatch = JSON.stringify(notifications);

	await drizzle
		.update(user)
		.set({
			settings: sql`
				COALESCE(${user.settings}, '{}'::jsonb)
				|| jsonb_build_object(
					'notifications',
					COALESCE(${user.settings}->'notifications', ${defaultNotifications}::jsonb)
					|| ${notificationPatch}::jsonb
				)
			`
		})
		.where(eq(user.id, userId));
}
