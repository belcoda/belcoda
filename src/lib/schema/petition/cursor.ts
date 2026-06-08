import * as v from 'valibot';
import { uuid } from '$lib/schema/helpers';

export const petitionListCursorSchema = v.object({
	createdAt: v.number(),
	id: uuid
});

export type PetitionListCursor = v.InferOutput<typeof petitionListCursorSchema>;
