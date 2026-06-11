import * as v from 'valibot';
import { uuid } from '$lib/schema/helpers';

export const personNoteListCursorSchema = v.object({
	createdAt: v.number(),
	id: uuid
});

export type PersonNoteListCursor = v.InferOutput<typeof personNoteListCursorSchema>;
