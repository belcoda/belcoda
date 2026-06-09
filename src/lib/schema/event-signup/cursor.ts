import * as v from 'valibot';
import { uuid } from '$lib/schema/helpers';

export const eventSignupListCursorSchema = v.object({
	createdAt: v.number(),
	id: uuid
});

export type EventSignupListCursor = v.InferOutput<typeof eventSignupListCursorSchema>;
