import { drizzle } from 'drizzle-orm/postgres-js';
import { reset } from 'drizzle-seed';
import * as schema from '$lib/schema/drizzle';
export default async function main() {
	try {
		console.assert(process.env.DATABASE_URL, 'DATABASE_URL is not set');
		validatePostgresConnectionString(process.env.DATABASE_URL!);
		const db = drizzle(process.env.DATABASE_URL!);
		await reset(db, schema); //reset the entire databas
	} catch (err) {
		console.error('Error resetting database. Continuing with next script...', err);
		process.exit(0); //exit with success code so that the next script can run anyway
	}
}

main().then(() => process.exit(0));

import { URL } from 'url';

// This is a safety check to ensure we're not accidentally resetting the production database
function validatePostgresConnectionString(connStr: string) {
	let url;
	try {
		url = new URL(connStr);
	} catch (err) {
		throw new Error(
			`Invalid connection string: ${err instanceof Error ? err.message : 'Unknown error'}`
		);
	}

	if (url.protocol !== 'postgres:' && url.protocol !== 'postgresql:') {
		throw new Error(`Invalid protocol: ${url.protocol}. Expected "postgres:" or "postgresql:"`);
	}

	if (url.hostname !== 'localhost') {
		throw new Error(`Invalid host: ${url.hostname}. Only "localhost" is allowed.`);
	}

	if (url.port && url.port !== '5432') {
		throw new Error(`Invalid port: ${url.port}. Default Postgres port is 5432.`);
	}

	// Optional: if no port specified, assume default
	if (!url.port) {
		url.port = '5432';
	}

	return true; // valid
}
