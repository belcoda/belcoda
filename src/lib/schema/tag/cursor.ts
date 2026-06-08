import * as v from 'valibot';
import { uuid } from '$lib/schema/helpers';

export const tagListCursorSchema = v.object({
	createdAt: v.number(),
	id: uuid
});

export type TagListCursor = v.InferOutput<typeof tagListCursorSchema>;
