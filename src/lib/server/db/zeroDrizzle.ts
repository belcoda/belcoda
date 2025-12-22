import postgres from 'postgres';
import { zeroDrizzle } from '@rocicorp/zero/server/adapters/drizzle';
import * as drizzleSchema from '$lib/schema/drizzle';
import { schema } from '$lib/zero/schema';
import { env } from '$env/dynamic/private';
import { drizzle } from 'drizzle-orm/postgres-js';
import { db as drizzleDb } from '$lib/server/db';
export const db = zeroDrizzle(schema, drizzleDb);

export async function getTransaction() {
	return db.transaction(async (tx) => {
		return tx;
	});
}
export type Transaction = Awaited<ReturnType<typeof getTransaction>>;
export type Query = Transaction['query'];
