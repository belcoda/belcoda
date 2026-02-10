import { drizzle as drizzleProvider } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '$lib/schema/drizzle';
import { env } from '$env/dynamic/private';
import { zeroDrizzle } from '@rocicorp/zero/server/adapters/drizzle';
import { schema as zeroSchema } from '$lib/zero/schema';

if (!env.DATABASE_URL) throw new Error('DATABASE_URL is not set');

const client = postgres(env.DATABASE_URL);

export const drizzle = drizzleProvider(client, { schema });

export const db = zeroDrizzle(zeroSchema, drizzle);

// Register the database provider for type safety
declare module '@rocicorp/zero' {
	interface DefaultTypes {
		dbProvider: typeof db;
	}
}
