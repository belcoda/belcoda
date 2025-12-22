import { PushProcessor } from '@rocicorp/zero/server';
import { db as drizzleDb } from '$lib/server/db/index';
import { zeroDrizzle } from '@rocicorp/zero/server/adapters/drizzle';
import { schema } from '$lib/zero/schema';

// PushProcessor is provided by Zero to encapsulate a standard
// implementation of the push protocol.
export const processor = new PushProcessor(zeroDrizzle(schema, drizzleDb));
