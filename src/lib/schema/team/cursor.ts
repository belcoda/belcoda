import * as v from 'valibot';
import { uuid } from '$lib/schema/helpers';

export const teamListCursorSchema = v.object({
	createdAt: v.number(),
	id: uuid
});

export type TeamListCursor = v.InferOutput<typeof teamListCursorSchema>;
