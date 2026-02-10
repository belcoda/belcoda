import type { ActionCodeSchema } from '$lib/schema/action-code';
import { _getActionCodeUnsafe } from '$lib/server/api/data/action/check';
import pino from '$lib/pino';
const log = pino(import.meta.url);
// action codes look like [#j1r2qf]
export function extractActionCode(message: string): string | null {
	const actionCode = message.match(/\[#([a-zA-Z0-9]{6})\]/g);
	log.info({ actionCode }, 'Extracted from message');
	if (actionCode) {
		return actionCode[0].replace('[#', '').replace(']', '');
	}
	return null;
}
