import { type Schema as ZeroSchema } from '@rocicorp/zero';
import { schema as importedSchema } from './zero-schema.gen'; // don't use the $lib alias as it isn't runnable in CI
import { createBuilder } from '@rocicorp/zero';
import { array, object, type ObjectSchema, type InferOutput } from 'valibot';
import { uuid } from '$lib/schema/helpers';

export const schema = {
	...importedSchema,
	enableLegacyQueries: false
} as const satisfies ZeroSchema;

export type Schema = typeof schema;

export const builder = createBuilder(schema);

export const queryContextSchema = object({
	userId: uuid,
	authTeams: array(uuid),
	adminOrgs: array(uuid),
	ownerOrgs: array(uuid),
	otherOrgs: array(uuid)
});

export type QueryContext = {
	userId: string;
	authTeams: string[];
	adminOrgs: string[];
	ownerOrgs: string[];
	otherOrgs: string[];
};

export type MutatorResult = Array<InferOutput<ObjectSchema<any, any>> | null>;
export type MutatorAsyncTasks = Array<() => Promise<void>>;
export type MutatorParams = {
	queryContext: QueryContext;
	asyncTasks: MutatorAsyncTasks;
	result: MutatorResult;
};
