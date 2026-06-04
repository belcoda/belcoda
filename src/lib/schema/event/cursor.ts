import * as v from 'valibot';
import { uuid } from '$lib/schema/helpers';

export const eventListCursorSchema = v.object({
	startsAt: v.number(),
	id: uuid
});

export type EventListCursor = v.InferOutput<typeof eventListCursorSchema>;
