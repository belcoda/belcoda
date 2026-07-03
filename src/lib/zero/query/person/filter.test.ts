import { describe, it, expect } from 'vitest';
import { type ExpressionBuilder } from '@rocicorp/zero';
import { type Schema, type QueryContext } from '$lib/zero/schema';
import { type InferOutput } from 'valibot';
import { whereClause, inputSchema } from './filter';
import { type FilterType } from '$lib/schema/person/filter';

/**
 * Minimal descriptive node produced by the fake ExpressionBuilder below. Each
 * builder method returns a plain object describing the expression tree so tests
 * can assert on its shape without a real Zero query engine.
 */
type Node =
	| { op: 'and'; conditions: Node[] }
	| { op: 'or'; conditions: Node[] }
	| { op: 'not'; condition: Node }
	| { op: 'cmp'; field: string; comparator: string; value: unknown }
	| { op: 'exists'; relationship: string };

/**
 * There is no existing Zero ExpressionBuilder mocking pattern in the repo, so we
 * build a minimal fake whose and/or/not/cmp/exists return plain descriptive
 * nodes. It is cast to the real builder type when handed to whereClause.
 */
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
		exists: (relationship: string): Node => ({ op: 'exists', relationship })
	};
	return builder as unknown as ExpressionBuilder<'person', Schema>;
}

const ctx: QueryContext = {
	userId: 'user-1',
	authTeams: [],
	adminOrgs: [],
	ownerOrgs: [],
	otherOrgs: []
};

const ORGANIZATION_ID = '00000000-0000-0000-0000-0000000000ff';
const PERSON_A = '11111111-1111-1111-1111-111111111111';
const PERSON_B = '22222222-2222-2222-2222-222222222222';

function personIdFilter(personId: string): FilterType {
	return {
		type: 'personId',
		personId,
		label: `Person ${personId}`,
		givenName: null,
		familyName: null,
		profilePicture: null
	};
}

function run(filterGroup: { type: 'and' | 'or'; filters: FilterType[]; exclude: FilterType[] }) {
	const input: InferOutput<typeof inputSchema> = {
		filter: filterGroup,
		organizationId: ORGANIZATION_ID
	};
	return whereClause(createFakeBuilder(), { filter: input, ctx }) as unknown as Node;
}

// whereClause returns and(permissions, deletedAt, organizationId, include[, exclude]).
// These helpers pull the include / exclude sub-expressions back out by position.
function includeExpression(result: Node): Node {
	expect(result.op).toBe('and');
	if (result.op !== 'and') throw new Error('expected top-level and');
	// index 0 = permissions, 1 = deletedAt, 2 = organizationId, 3 = include filters
	return result.conditions[3];
}

function excludeExpression(result: Node): Node | undefined {
	expect(result.op).toBe('and');
	if (result.op !== 'and') throw new Error('expected top-level and');
	// exclude, when present, is the last (5th) condition and is negated.
	return result.conditions[4];
}

function idComparison(node: Node): string {
	expect(node.op).toBe('cmp');
	if (node.op !== 'cmp') throw new Error('expected cmp');
	expect(node.field).toBe('id');
	expect(node.comparator).toBe('=');
	return node.value as string;
}

describe('person whereClause include composition', () => {
	it('ORs multiple individual people together even under type "and"', () => {
		const result = run({
			type: 'and',
			filters: [personIdFilter(PERSON_A), personIdFilter(PERSON_B)],
			exclude: []
		});

		const include = includeExpression(result);
		expect(include.op).toBe('or');
		if (include.op !== 'or') throw new Error('expected or');
		const ids = include.conditions.map(idComparison);
		expect(ids).toEqual([PERSON_A, PERSON_B]);
	});

	it('unions (ORs) individual people with a non-person condition under "and"', () => {
		const result = run({
			type: 'and',
			filters: [{ type: 'country', country: 'JP', label: 'Japan' }, personIdFilter(PERSON_A)],
			exclude: []
		});

		const include = includeExpression(result);
		// The top-level include combinator must be an OR (union), NOT an AND
		// (intersection) — otherwise the specific person is filtered away.
		expect(include.op).toBe('or');
		if (include.op !== 'or') throw new Error('expected or');
		expect(include.conditions).toHaveLength(2);

		// First branch: the non-person condition group (still combined via `and`).
		const nonPerson = include.conditions[0];
		expect(nonPerson.op).toBe('and');
		if (nonPerson.op !== 'and') throw new Error('expected and');
		expect(nonPerson.conditions[0]).toMatchObject({
			op: 'cmp',
			field: 'country',
			value: 'JP'
		});

		// Second branch: the OR of individual people.
		const people = include.conditions[1];
		expect(people.op).toBe('or');
		if (people.op !== 'or') throw new Error('expected or');
		expect(people.conditions.map(idComparison)).toEqual([PERSON_A]);
	});

	it('resolves an empty filter group to the "no recipients" shape (empty or)', () => {
		const result = run({ type: 'or', filters: [], exclude: [] });

		const include = includeExpression(result);
		expect(include).toEqual({ op: 'or', conditions: [] });
	});
});

describe('person whereClause exclude composition', () => {
	it('negates an OR of each excluded person so all are removed', () => {
		const result = run({
			type: 'or',
			filters: [],
			exclude: [personIdFilter(PERSON_A), personIdFilter(PERSON_B)]
		});

		const exclude = excludeExpression(result);
		expect(exclude?.op).toBe('not');
		if (exclude?.op !== 'not') throw new Error('expected not');

		// not(or(id = A, id = B))
		const negated = exclude.condition;
		expect(negated.op).toBe('or');
		if (negated.op !== 'or') throw new Error('expected or');
		expect(negated.conditions.map(idComparison)).toEqual([PERSON_A, PERSON_B]);
	});

	it('ORs mixed exclude types so each condition removes people independently', () => {
		const result = run({
			type: 'or',
			filters: [],
			exclude: [{ type: 'country', country: 'JP', label: 'Japan' }, personIdFilter(PERSON_A)]
		});

		const exclude = excludeExpression(result);
		expect(exclude?.op).toBe('not');
		if (exclude?.op !== 'not') throw new Error('expected not');

		// not(or(country = JP, id = A)) — not not(and(...)) which would require both.
		const negated = exclude.condition;
		expect(negated.op).toBe('or');
		if (negated.op !== 'or') throw new Error('expected or');
		expect(negated.conditions).toHaveLength(2);
		expect(negated.conditions[0]).toMatchObject({
			op: 'cmp',
			field: 'country',
			value: 'JP'
		});
		expect(idComparison(negated.conditions[1])).toBe(PERSON_A);
	});

	it('omits the exclude clause when no supported exclude predicates remain', () => {
		const result = run({
			type: 'or',
			filters: [],
			exclude: [{ type: 'teamId', teamId: 'team-1', label: 'Team 1' }]
		});

		expect(excludeExpression(result)).toBeUndefined();
	});
});
