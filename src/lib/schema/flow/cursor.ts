import * as v from 'valibot';
import { uuid } from '$lib/schema/helpers';

// Both the flow list and the flow execution list order by (createdAt desc, id desc), so they share
// the same keyset-cursor shape.
export const flowListCursorSchema = v.object({
	createdAt: v.number(),
	id: uuid
});
export type FlowListCursor = v.InferOutput<typeof flowListCursorSchema>;
