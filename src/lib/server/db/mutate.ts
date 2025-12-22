import { type Query, db } from './zeroDrizzle'; // Assuming 'db' is your Drizzle instance
import { parse, type GenericSchema } from 'valibot';
import { renderValiError } from '$lib/schema/helpers';
import pino from '$lib/pino';
import type { Transaction } from '$lib/server/db/zeroDrizzle';
const log = pino(import.meta.url);
import { getQueryContext } from '../api/utils/auth/permissions';
import type {
	MutatorAsyncTasks,
	MutatorParams,
	MutatorResult,
	QueryContext
} from '$lib/zero/schema';
/**
 * Runs a query and returns the result.
 * @param query - The query to run.
 * @param input - The input to the query.
 * @param ctx - The context to the query.
 * @param inputSchema - The schema of the input.
 * @param outputSchema - The schema of the output.
 * @param fallback - The fallback data to return if the query fails. This is often because the query didn't match any results, and returns undefined for some reason, instead of an empty array
 
 * @returns {400} If the input and the validation error if the input is invalid.
 * @returns {500} If the query fails.
 * @returns {404} If the query fails and fallback is '404'.
 * @returns {200} and an empty array if the query fails and fallback is 'emptyArray'.
 * @returns {200} and the result if the query succeeds.
 */
export async function runMutator<MutatorInput, ValidatedInput, MutatorOutput, ValidatedOutput>({
	mutator,
	input,
	userId,
	inputSchema,
	outputSchema,
	fallback = '404'
}: {
	mutator: (params: MutatorParams) => (tx: Transaction, input: ValidatedInput) => Promise<void>;
	input: MutatorOutput;
	userId: string;
	inputSchema: GenericSchema<MutatorInput, ValidatedInput>;
	outputSchema: GenericSchema<unknown, ValidatedOutput>;
	fallback?: '404' | 'emptyArray' | 'emptyObject' | 'null';
}): Promise<
	| { status: 200; data: ValidatedOutput | [] | {} | null }
	| { status: 204; data: undefined }
	| { status: 400; data: ReturnType<typeof renderValiError> }
	| { status: 500; data: { error: 'An unexpected error occurred' } }
	| { status: 404; data: { error: 'Resource not found' } }
> {
	try {
		const ctx = await getQueryContext(userId);
		const parsedInput = parse(inputSchema, input);
		return db.transaction(async (tx) => {
			const asyncTasks: MutatorAsyncTasks = [];
			const result: Array<MutatorOutput | null> = [];
			const mutatorFunction = mutator({
				queryContext: ctx,
				asyncTasks,
				result: result as MutatorResult[]
			});
			try {
				await mutatorFunction(tx, parsedInput);
				const promiseResults = await Promise.allSettled(asyncTasks.map((task) => task()));
				if (promiseResults.some((result) => result.status === 'rejected')) {
					log.error(
						promiseResults.find((result) => result.status === 'rejected')?.reason,
						'Error executing async tasks in mutator'
					);
					return { status: 500, data: { error: 'An unexpected error occurred' } };
				}
				if (result) {
					try {
						const resultToParse = result.length > 1 ? result : result[0];
						const parsedOutput = parse(outputSchema, resultToParse);
						return { status: 200, data: parsedOutput as ValidatedOutput };
					} catch (error) {
						log.info({ error: renderValiError(error) }, 'Error parsing output in API transaction');
						return { status: 500, data: { error: 'An unexpected error occurred' } };
					}
				} else {
					return { status: 204, data: undefined };
				}
			} catch (error) {
				log.error({ error }, 'Error running mutator in API transaction');
				return { status: 500, data: { error: 'An unexpected error occurred' } };
			}
		});
	} catch (error) {
		log.warn({ error }, 'Error parsing input in mutator');
		return { status: 400, data: renderValiError(error) };
	}
}
