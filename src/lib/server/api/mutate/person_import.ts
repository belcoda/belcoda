import type { MutatorParams } from '$lib/zero/schema';
import pino from '$lib/pino';

const log = pino(import.meta.url);

export function insertPersonImport(_params: MutatorParams) {
	return async function (_args: unknown) {
		// Client-side mutator handles the actual insertion
		log.debug({ _args }, 'Person import insertion');
		return _args;
	};
}

export function triggerImportQueue(_params: MutatorParams) {
	return async function ({ personImportId }: { personImportId: string }) {
		try {
			// TODO: Implement queue triggering logic
			log.info({ personImportId }, 'Triggering person import queue');
		} catch (err) {
			log.error({ err, personImportId }, 'Failed to trigger person import queue');
			throw err;
		}
	};
}
