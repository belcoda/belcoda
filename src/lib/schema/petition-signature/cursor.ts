import * as v from 'valibot';
import { uuid } from '$lib/schema/helpers';

export const petitionSignatureListCursorSchema = v.object({
	createdAt: v.number(),
	id: uuid
});

export type PetitionSignatureListCursor = v.InferOutput<typeof petitionSignatureListCursorSchema>;
