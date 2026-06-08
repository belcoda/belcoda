import * as v from 'valibot';
import { uuid } from '$lib/schema/helpers';

export const communicationsListCursorSchema = v.object({
	updatedAt: v.number(),
	id: uuid
});

export type CommunicationsListCursor = v.InferOutput<typeof communicationsListCursorSchema>;
