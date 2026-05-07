import { building, dev } from '$app/environment';
import { PgBoss } from 'pg-boss';
import pino from '$lib/pino';
const log = pino(import.meta.url);
import { env } from '$env/dynamic/private';
const { DATABASE_URL } = env;

import * as allHandlersMap from '$lib/server/queue/handlers/index';
const handlersNames = Object.keys(allHandlersMap) as (keyof typeof allHandlersMap)[];

type WorkerOptions = {
	batchSize?: number; //default 1
	includeMetadata?: boolean; //default false
	priority?: boolean; //default true
	pollingIntervalSeconds?: number; //default 2
};
export const DEFAULT_QUEUE_WORKER_OPTIONS: WorkerOptions = {
	batchSize: 1,
	pollingIntervalSeconds: 2
};

type QueueHandlers = {
	[K in keyof typeof allHandlersMap]: (
		input: Parameters<(typeof allHandlersMap)[K]>[0],
		options?: QueueSendOptions
	) => Promise<void>;
};

type QueueDbAdapter = {
	executeSql: (text: string, values: unknown[]) => Promise<{ rows: unknown[]; rowCount?: number }>;
};

type QueueSendOptions = {
	db?: QueueDbAdapter;
};
import type { ServerTransaction } from '@rocicorp/zero';
function _createTxDbWrapper(trx: ServerTransaction) {
	return {
		executeSql: async (text: string, values: unknown[]) => {
			const result = await trx.dbTransaction.query(text, values);
			const resultArray = Array.from(result);
			return { rows: resultArray, rowCount: resultArray.length };
		}
	};
}

export function queueSendOptionsFromTransaction(transaction: ServerTransaction): QueueSendOptions {
	return {
		db: _createTxDbWrapper(transaction)
	};
}

type Queue = {
	raw: PgBoss;
	activeWorkers: Set<string>; // Track registered workers
} & QueueHandlers;

declare global {
	var __queue__: Queue | undefined;
}

// 1. Modified Worker Starter
async function createAndStartQueues(queueInstance: Queue) {
	const { raw: boss, activeWorkers } = queueInstance;

	for (const queueName of handlersNames) {
		// Check if this specific worker is already active on this instance
		if (activeWorkers.has(queueName)) {
			log.debug(`🔄 Worker for ${queueName} already active, skipping registration.`);
			continue;
		}

		await boss.createQueue(queueName);
		log.debug(`✅ Queue ${queueName} created`);

		log.debug(`🚀 Starting worker for ${queueName}`);
		const handler = allHandlersMap[queueName];

		await boss.work(queueName, DEFAULT_QUEUE_WORKER_OPTIONS, async (jobs) => {
			for (const job of jobs) {
				try {
					await handler(job.data as Parameters<typeof handler>[0]);
				} catch (err) {
					log.error({ err, jobId: job.id }, `🚨 Handler failed: ${queueName}`);
					throw err;
				}
			}
		});

		activeWorkers.add(queueName);
	}
}

// 2. Modified Stopper
async function stopQueues(queueInstance: Queue) {
	const { raw: boss, activeWorkers } = queueInstance;

	for (const queueName of Array.from(activeWorkers)) {
		log.debug(`Stopping worker for ${queueName}`);
		await boss.offWork(queueName);
		activeWorkers.delete(queueName);
	}
}

function createHandlers(queue: PgBoss): QueueHandlers {
	const handlers = {} as QueueHandlers;
	for (const queueName of handlersNames) {
		handlers[queueName] = async (input: unknown, options?: QueueSendOptions) => {
			await queue.send(queueName, input as object, options); // pgboss' send function expects type object rather than 'unknown' because we don't have solid inference here
		};
	}
	return handlers;
}

async function initQueue() {
	if (building) {
		throw new Error('🚨 Queue cannot be initialized in building environment');
	}
	const queue = new PgBoss(DATABASE_URL);
	queue.on('error', (err) => {
		log.error(err, '🚨 Error in PgBoss');
	});
	await queue.start();
	log.info('✨ Queue started');
	return queue;
}
export async function getQueue() {
	if (!global.__queue__) {
		const boss = await initQueue();
		const queueInstance = {
			raw: boss,
			activeWorkers: new Set<string>(),
			...({} as QueueHandlers) // Temporary placeholder
		};

		// Initialize workers
		await createAndStartQueues(queueInstance);

		// Attach handlers
		const handlers = createHandlers(boss);
		Object.assign(queueInstance, handlers);

		global.__queue__ = queueInstance;
	} else if (dev) {
		// NOTE: HMR for queue workers is not supported.
		// Queue workers run background jobs via pg-boss, and their handler
		// code is registered once at startup. To pick up changes in handlers,
		// you must restart the dev server. HMR reloads the module but the
		// running worker processes retain references to the old handler code.
		log.debug('Queue workers do not support HMR. Restart the server to see handler changes.');
	}

	return global.__queue__;
}
