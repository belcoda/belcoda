// app/api/mutate/db-provider.ts
import { zeroDrizzle } from '@rocicorp/zero/server/adapters/drizzle';
import { schema } from '$lib/zero/schema';
import { db } from '$lib/server/db';
export const dbProvider = zeroDrizzle(schema, db);

// Register the database provider for type safety
declare module '@rocicorp/zero' {
	interface DefaultTypes {
		dbProvider: typeof dbProvider;
	}
}
