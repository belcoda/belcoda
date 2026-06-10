import * as v from 'valibot';
import { uuid } from '$lib/schema/helpers';

export const activityListCursorSchema = v.object({
	createdAt: v.number(),
	id: uuid
});

export type ActivityListCursor = v.InferOutput<typeof activityListCursorSchema>;
