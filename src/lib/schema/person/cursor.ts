import * as v from 'valibot';
import { uuid } from '$lib/schema/helpers';

export const personListCursorSchema = v.object({
	mostRecentActivityAt: v.number(),
	id: uuid
});

export type PersonListCursor = v.InferOutput<typeof personListCursorSchema>;
