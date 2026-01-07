import * as v from 'valibot';
import { get } from '$lib/utils/http';
import { eventSchema } from '$lib/schema/event';

export function generateEventTitleAsyncSchema(organizationId: string, excludeEventId?: string) {
	const eventTitle = v.pipeAsync(
		eventSchema.entries.title,
		v.checkAsync(async (value) => {
			try {
				const result = await get({
					path: `/api/utils/check/event/title?title=${value}&organizationId=${organizationId}${excludeEventId ? `&excludeEventId=${excludeEventId}` : ''}`,
					schema: v.object({ result: v.boolean() })
				});
				if (result.result) {
					//event exists, that's an error, title must be unique
					return false;
				} else {
					return true;
				}
			} catch (error) {
				return false;
			}
		}, 'Another event exists with this title')
	);
	const eventSlug = v.pipeAsync(
		eventSchema.entries.slug,
		v.checkAsync(async (value) => {
			try {
				const result = await get({
					path: `/api/utils/check/event/slug?slug=${value}&organizationId=${organizationId}${excludeEventId ? `&excludeEventId=${excludeEventId}` : ''}`,
					schema: v.object({ result: v.boolean() })
				});
				if (result.result) {
					//event exists, that's an error, slug must be unique
					return false;
				} else {
					return true;
				}
			} catch (error) {
				return false;
			}
		}, 'Another event exists with this slug')
	);

	return { title: eventTitle, slug: eventSlug };
}
