import type { MutatorParams } from '$lib/zero/schema';
import pino from '$lib/pino';
import { getQueue } from '$lib/server/queue';

const log = pino(import.meta.url);

export function insertPersonImport(_params: MutatorParams) {
	return async function (_args: unknown) {
		// Client-side mutator handles the actual insertion
		log.debug({ _args }, 'Person import insertion');
		return _args;
	};
}

export function triggerImportQueue(_params: MutatorParams) {
	return async function ({
		personImportId,
		organizationId
	}: {
		personImportId: string;
		organizationId: string;
	}) {
		try {
			log.info({ personImportId, organizationId }, 'Triggering person import queue');
			const queue = await getQueue();
			await queue.importPeople({
				personImportId,
				organizationId
			});
		} catch (err) {
			log.error({ err, personImportId }, 'Failed to trigger person import queue');
			throw err;
		}
	};
}
