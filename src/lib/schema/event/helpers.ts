import * as v from 'valibot';
import { get } from '$lib/utils/http';
import { eventSchema } from '$lib/schema/event';
import { useDebounce } from 'runed';

/**
 * Creates a debounced async check that batches rapid validation calls.
 * Slug/title validation runs on every form change, so we debounce to avoid
 * spamming the API on every keystroke. Skips empty values to avoid 400 errors.
 */
function createDebouncedAsyncCheck(
	buildPath: (value: string) => string,
	delayMs = 300
): (value: string) => Promise<boolean> {
	const pendingResolvers: Array<(valid: boolean) => void> = [];

	const debouncedCheck = useDebounce(
		async (value: string) => {
			if (!value?.trim()) {
				pendingResolvers.splice(0).forEach((resolve) => resolve(true));
				return true;
			}
			try {
				const result = await get({
					path: buildPath(value) as `/${string}`,
					schema: v.object({ result: v.boolean() })
				});
				const valid = !result.result;
				pendingResolvers.splice(0).forEach((resolve) => resolve(valid));
				return valid;
			} catch {
				pendingResolvers.splice(0).forEach((resolve) => resolve(false));
				return false;
			}
		},
		() => delayMs
	);

	return (value: string): Promise<boolean> => {
		if (!value?.trim()) {
			return Promise.resolve(true);
		}
		return new Promise<boolean>((resolve) => {
			pendingResolvers.push(resolve);
			debouncedCheck(value);
		});
	};
}

export function generateEventTitleAsyncSchema(organizationId: string, excludeEventId?: string) {
	const checkTitle = createDebouncedAsyncCheck(
		(value) =>
			`/api/utils/check/event/title?title=${encodeURIComponent(value)}&organizationId=${organizationId}${excludeEventId ? `&excludeEventId=${excludeEventId}` : ''}`
	);
	const checkSlug = createDebouncedAsyncCheck(
		(value) =>
			`/api/utils/check/event/slug?slug=${encodeURIComponent(value)}&organizationId=${organizationId}${excludeEventId ? `&excludeEventId=${excludeEventId}` : ''}`
	);

	const eventTitle = v.pipeAsync(
		eventSchema.entries.title,
		v.checkAsync(checkTitle, 'Another event exists with this title')
	);
	const eventSlug = v.pipeAsync(
		eventSchema.entries.slug,
		v.checkAsync(checkSlug, 'Another event exists with this slug')
	);

	return { title: eventTitle, slug: eventSlug };
}
