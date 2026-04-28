import { describe, it, expect } from 'vitest';
import { isHttpError } from '@sveltejs/kit';
import { getApiQueryContext } from '$lib/server/api/utils/auth/permissions';
import { safeApiRouteQueryContext, buildApiListQueryFromUrl } from './restApi';

describe('safeApiRouteQueryContext', () => {
	it('throws 401 with message when organization id is null', () => {
		try {
			safeApiRouteQueryContext(null);
			expect.fail('expected throw');
		} catch (e) {
			expect(isHttpError(e, 401)).toBe(true);
			if (isHttpError(e)) {
				expect(e.body).toEqual({
					message: 'Unauthorized: Attempted to access API route without a valid API key'
				});
			}
		}
	});

	it('throws 401 when organization id is empty string', () => {
		try {
			safeApiRouteQueryContext('');
			expect.fail('expected throw');
		} catch (e) {
			expect(isHttpError(e, 401)).toBe(true);
		}
	});

	it('returns API query context for a non-empty organization id', () => {
		const orgId = '00000000-0000-4000-8000-000000000001';
		expect(safeApiRouteQueryContext(orgId)).toEqual(getApiQueryContext(orgId));
	});

	it('sets ownerOrgs to the provided organization id', () => {
		const orgId = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
		const ctx = safeApiRouteQueryContext(orgId);
		expect(ctx.ownerOrgs).toEqual([orgId]);
		expect(ctx.userId).toBeNull();
		expect(ctx.authTeams).toEqual([]);
		expect(ctx.adminOrgs).toEqual([]);
		expect(ctx.otherOrgs).toEqual([]);
	});
});

describe('buildApiListQueryFromUrl', () => {
	const orgId = '00000000-0000-4000-8000-000000000002';

	function urlWith(search: string) {
		return new URL(`https://example.test/api?${search}`);
	}

	it('uses defaults when search params are absent', () => {
		expect(
			buildApiListQueryFromUrl({
				organizationId: orgId,
				url: new URL('https://example.test/api')
			})
		).toEqual({
			organizationId: orgId,
			pageSize: 25,
			searchString: null,
			teamId: null,
			isDeleted: null,
			startAfter: null,
			excludedIds: []
		});
	});

	it('reads pageSize from pageSize query param', () => {
		expect(
			buildApiListQueryFromUrl({
				organizationId: orgId,
				url: urlWith('pageSize=100')
			}).pageSize
		).toBe(100);
	});

	it('caps pageSize at 100 when param exceeds maximum', () => {
		expect(
			buildApiListQueryFromUrl({
				organizationId: orgId,
				url: urlWith('pageSize=9001')
			}).pageSize
		).toBe(100);
	});

	it('reads search from search query param', () => {
		expect(
			buildApiListQueryFromUrl({
				organizationId: orgId,
				url: urlWith('search=alice')
			}).searchString
		).toBe('alice');
	});

	it('reads startAfter from startAfter query param', () => {
		expect(
			buildApiListQueryFromUrl({
				organizationId: orgId,
				url: urlWith('startAfter=cursor-token')
			}).startAfter
		).toBe('cursor-token');
	});

	it('preserves organizationId from arguments regardless of URL', () => {
		const built = buildApiListQueryFromUrl({
			organizationId: orgId,
			url: urlWith('organizationId=other-org')
		});
		expect(built.organizationId).toBe(orgId);
	});

	it('combines multiple query params', () => {
		expect(
			buildApiListQueryFromUrl({
				organizationId: orgId,
				url: urlWith('pageSize=10&search=pat&startAfter=s1')
			})
		).toEqual({
			organizationId: orgId,
			pageSize: 10,
			searchString: 'pat',
			teamId: null,
			isDeleted: null,
			startAfter: 's1',
			excludedIds: []
		});
	});

	it('falls back to default pageSize when pageSize is not a number', () => {
		expect(
			buildApiListQueryFromUrl({
				organizationId: orgId,
				url: urlWith('pageSize=not-a-number')
			}).pageSize
		).toBe(25);
	});

	it('uses 0 for pageSize when pageSize is zero', () => {
		expect(
			buildApiListQueryFromUrl({
				organizationId: orgId,
				url: urlWith('pageSize=0')
			}).pageSize
		).toBe(0);
	});
});
