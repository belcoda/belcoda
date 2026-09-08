import * as v from 'valibot';
import { flowListCursorSchema, type FlowListCursor } from '$lib/schema/flow/cursor';
import { decodeCursorOrNull, encodeCursor } from '$lib/utils/cursor';

export function encodeFlowListCursor(row: FlowListCursor): string {
	return encodeCursor(row);
}

export function decodeFlowListCursor(cursor: string): FlowListCursor | null {
	const decoded = decodeCursorOrNull(cursor);
	if (decoded === null) {
		return null;
	}
	const result = v.safeParse(flowListCursorSchema, decoded);
	return result.success ? result.output : null;
}
