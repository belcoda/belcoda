import { fail, redirect } from '@sveltejs/kit';
import { safeParse } from 'valibot';
import type { Actions, PageServerLoad } from './$types';
import { drizzle } from '$lib/server/db';
import { user } from '$lib/schema/drizzle';
import { eq } from 'drizzle-orm';
import {
	defaultUserSettings,
	parseUserSettings,
	userNotificationSettingsPatchSchema
} from '$lib/schema/user/settings';
import { updateUserSettings } from '$lib/server/api/data/user/user';

export const load: PageServerLoad = async ({ locals }) => {
	const userId = locals.session?.user?.id;
	if (!userId) redirect(302, '/signup');

	const row = await drizzle.query.user.findFirst({
		where: eq(user.id, userId),
		columns: { settings: true }
	});

	return {
		settings: parseUserSettings(row?.settings) ?? defaultUserSettings()
	};
};

export const actions: Actions = {
	save: async ({ locals, request }) => {
		const userId = locals.session?.user?.id;
		if (!userId) return fail(401, { error: 'Unauthorized' });

		const formData = await request.formData();
		const patch: Record<string, unknown> = {};

		const digestEnabled = formData.get('digestEnabled');
		if (digestEnabled !== null) patch.digestEnabled = digestEnabled === 'true';

		const digestFrequency = formData.get('digestFrequency');
		if (digestFrequency !== null) patch.digestFrequency = digestFrequency;

		const result = safeParse(userNotificationSettingsPatchSchema, patch);
		if (!result.success) return fail(400, { error: 'Invalid settings' });

		await updateUserSettings({ userId, notifications: result.output });

		return { success: true };
	}
};
