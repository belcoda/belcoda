import { type Query, db } from './zeroDrizzle'; // Assuming 'db' is your Drizzle instance
import type { QueryContext } from '$lib/zero/schema';
import { parse, type GenericSchema } from 'valibot';
import { renderValiError } from '$lib/schema/helpers';
import pino from '$lib/pino';
const log = pino(import.meta.url);
import { getQueryContext } from '../api/utils/auth/permissions';
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
export async function runQuery<P, R, POutput, QueryOutput>({
	query,
	input,
	userId,
	inputSchema,
	outputSchema,
	fallback = '404'
}: {
	query: (params: { tx: Query; ctx: QueryContext; input: POutput }) => {
		run: () => Promise<QueryOutput>;
	};
	input: P;
	userId: string;
	inputSchema: GenericSchema<P, POutput>;
	outputSchema: GenericSchema<QueryOutput, R>;
	fallback?: '404' | 'emptyArray' | 'emptyObject' | 'null';
}): Promise<
	| { status: 200; data: R | [] | {} | null }
	| { status: 400; data: ReturnType<typeof renderValiError> }
	| { status: 500; data: { error: 'An unexpected error occurred' } }
	| { status: 404; data: { error: 'Resource not found' } }
> {
	try {
		const ctx = await getQueryContext(userId);
		const parsedInput = await parse(inputSchema, input);
		return db.transaction(async (tx) => {
			const q = query({ tx: tx.query, ctx, input: parsedInput });
			try {
				const result = await q.run();
				try {
					const parsedOutput = parse(outputSchema, result);
					return { status: 200, data: parsedOutput as R };
				} catch (error) {
					log.info({ error: renderValiError(error) }, 'Error parsing output in API transaction');
					// Parsing error on output -- generally, this means the query returned an unexpected value
					// Often this is because the query didn't match any results, and returns undefined for some reason, instead of an empty array
					switch (fallback) {
						case 'emptyArray':
							return { status: 200, data: [] };
						case 'emptyObject':
							return { status: 200, data: {} };
						case 'null':
							return { status: 200, data: null };
						case '404':
							return { status: 404, data: { error: 'Resource not found' } };
						default:
							return { status: 404, data: { error: 'Resource not found' } }; //still the default fallback
					}
				}
			} catch (error) {
				log.error({ error }, 'Error running Zero query in API transaction');
				return { status: 500, data: { error: 'An unexpected error occurred' } };
			}
		});
	} catch (error) {
		log.warn({ error }, 'Error parsing input in API transaction');
		return { status: 400, data: renderValiError(error) };
	}
}
