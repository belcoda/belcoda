import { fail, redirect } from '@sveltejs/kit';
import { safeParse } from 'valibot';
import type { Actions, PageServerLoad } from './$types';
import { memberNotificationSettingsPatchSchema } from '$lib/schema/member/settings';
import { getMemberSettings, updateMemberSettings } from '$lib/server/api/data/organization/member';

export const load: PageServerLoad = async ({ locals, parent }) => {
	const userId = locals.session?.user?.id;
	if (!userId) redirect(302, '/signup');
	const { defaultActiveOrganizationId } = await parent();

	return {
		organizationId: defaultActiveOrganizationId,
		settings: await getMemberSettings({ userId, organizationId: defaultActiveOrganizationId })
	};
};

export const actions: Actions = {
	save: async ({ locals, request }) => {
		const userId = locals.session?.user?.id;
		if (!userId) return fail(401, { error: 'Unauthorized' });

		const formData = await request.formData();
		const organizationId = formData.get('organizationId');
		if (typeof organizationId !== 'string') return fail(400, { error: 'Invalid organization' });

		const patch: Record<string, unknown> = {};

		const digestEnabled = formData.get('digestEnabled');
		if (digestEnabled !== null) patch.digestEnabled = digestEnabled === 'true';

		const digestFrequency = formData.get('digestFrequency');
		if (digestFrequency !== null) patch.digestFrequency = digestFrequency;

		const result = safeParse(memberNotificationSettingsPatchSchema, patch);
		if (!result.success) return fail(400, { error: 'Invalid settings' });

		try {
			await updateMemberSettings({ userId, organizationId, notifications: result.output });
		} catch {
			return fail(403, { error: 'Member not found' });
		}

		return { success: true };
	}
};
