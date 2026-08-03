import { describe, expect, it } from 'vitest';
import type { ExpressionBuilder } from '@rocicorp/zero';
import { parse } from 'valibot';

import type { QueryContext, Schema } from '$lib/zero/schema';
import { inputSchema, whereClause } from './list';

type QueryFilter =
	| { type: 'where'; field: string; comparator: string; value: unknown }
	| { type: 'exists'; relationship: string; filters: QueryFilter[] };

type Node =
	| { op: 'and'; conditions: Node[] }
	| { op: 'or'; conditions: Node[] }
	| { op: 'not'; condition: Node }
	| { op: 'cmp'; field: string; comparator: string; value: unknown }
	| { op: 'exists'; relationship: string; filters: QueryFilter[] };

function createRelatedQuery(filters: QueryFilter[] = []) {
	const query = {
		where(field: string, comparator: string, value: unknown) {
			filters.push({ type: 'where', field, comparator, value });
			return query;
		},
		whereExists(relationship: string, callback: (related: unknown) => unknown) {
			const relatedFilters: QueryFilter[] = [];
			callback(createRelatedQuery(relatedFilters));
			filters.push({ type: 'exists', relationship, filters: relatedFilters });
			return query;
		}
	};
	return query;
}

function createFakeBuilder() {
	const builder = {
		and: (...conditions: Node[]): Node => ({ op: 'and', conditions }),
		or: (...conditions: Node[]): Node => ({ op: 'or', conditions }),
		not: (condition: Node): Node => ({ op: 'not', condition }),
		cmp: (field: string, comparator: string, value?: unknown): Node => ({
			op: 'cmp',
			field,
			comparator,
			value
		}),
		exists: (
			relationship: string,
			callback?: (query: ReturnType<typeof createRelatedQuery>) => unknown
		): Node => {
			const filters: QueryFilter[] = [];
			callback?.(createRelatedQuery(filters));
			return { op: 'exists', relationship, filters };
		}
	};
	return builder as unknown as ExpressionBuilder<'person', Schema>;
}

const organizationId = '11111111-1111-4111-8111-111111111111';
const userId = '22222222-2222-4222-8222-222222222222';
const ctx: QueryContext = {
	userId,
	authTeams: [],
	adminOrgs: [],
	ownerOrgs: [],
	otherOrgs: [organizationId]
};

function run(favouriteMode: 'all' | 'only' | 'exclude') {
	const filter = parse(inputSchema, { organizationId, favouriteMode });
	return whereClause(createFakeBuilder(), { filter, ctx }) as unknown as Node;
}

function favouriteExpression(result: Node) {
	expect(result.op).toBe('and');
	if (result.op !== 'and') throw new Error('expected top-level and');
	return result.conditions[1];
}

describe('person list favourite modes', () => {
	it('defaults to returning all people', () => {
		expect(parse(inputSchema, { organizationId }).favouriteMode).toBe('all');
		expect(run('all')).toEqual({
			op: 'and',
			conditions: [{ op: 'cmp', field: 'deletedAt', comparator: 'IS', value: null }]
		});
	});

	it('includes only current-member person favourites', () => {
		const favourite = favouriteExpression(run('only'));

		expect(favourite).toEqual({
			op: 'exists',
			relationship: 'favourites',
			filters: [
				{ type: 'where', field: 'organizationId', comparator: '=', value: organizationId },
				{ type: 'where', field: 'referenceType', comparator: '=', value: 'person' },
				{
					type: 'exists',
					relationship: 'member',
					filters: [{ type: 'where', field: 'userId', comparator: '=', value: userId }]
				}
			]
		});
	});

	it('excludes current-member person favourites', () => {
		expect(favouriteExpression(run('exclude'))).toMatchObject({
			op: 'not',
			condition: { op: 'exists', relationship: 'favourites' }
		});
	});
});
