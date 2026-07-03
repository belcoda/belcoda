import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { parse } from 'valibot';
import { drizzle } from '$lib/server/db';
import { eq } from 'drizzle-orm';
import * as schema from '$lib/schema/drizzle';
import { userSettingsSchema } from '$lib/schema/user/settings';
import pino from '$lib/pino';

const log = pino(import.meta.url);

export const PATCH: RequestHandler = async (event) => {
	const userId = event.locals.session?.session.userId;
	if (!userId) throw error(401, 'Unauthorized');

	const body = await event.request.json();
	const settings = parse(userSettingsSchema, body);

	try {
		const [updated] = await drizzle
			.update(schema.user)
			.set({ settings })
			.where(eq(schema.user.id, userId))
			.returning({ settings: schema.user.settings });

		return json(updated.settings);
	} catch (err) {
		log.error({ err }, 'Failed to update user settings');
		throw error(500, 'Failed to update settings');
	}
};
