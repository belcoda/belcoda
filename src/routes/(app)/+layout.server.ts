import { error, redirect } from '@sveltejs/kit';
import { parse } from 'valibot';

import { getQueryContext } from '$lib/server/api/utils/auth/permissions';
import { _listOrganizationMembershipsByUserIdUnsafe } from '$lib/server/api/data/organization';
import { inferOrganizationIdFromUrl } from '$lib/server/api/utils/infer_organization';
import { queryContextSchema, type QueryContext } from '$lib/zero/schema';

/**
 * Builds page data from the current session, the user's organization memberships, and a validated query context.
 *
 * @returns An object containing:
 * - `userId` — the authenticated user's id
 * - `defaultActiveOrganizationId` — the chosen active organization id or `null` (never returned here because missing causes a redirect)
 * - `inferredOrganizationId` — an organization id inferred from the URL or `null`
 * - `organizations` — array of `{ organizationId }` derived from the user's memberships
 * - `memberships` — same value as `organizations`
 * - `queryContext` — the parsed and validated query context
 *
 * @throws Redirects to `/signup` (302) when there is no session or the session user id is missing/blank.
 * @throws Redirects to `/organization` (302) when no active organization id can be determined.
 * @throws Error (500) with message `Invalid query context: ...` when `rawQueryContext` fails schema validation.
 * @throws Error (500) with message `Query context userId does not match session` when the parsed query context's `userId` differs from the session `userId`.
 */
export async function load({ locals, url }) {
	const session = locals.session;

	if (!session) {
		throw redirect(302, '/signup');
	}

	const userId = session.user?.id;
	if (!userId || String(userId).trim() === '') {
		throw redirect(302, '/signup');
	}

	const [memberships, rawQueryContext] = await Promise.all([
		_listOrganizationMembershipsByUserIdUnsafe({ userId }),
		getQueryContext(userId)
	]);

	let queryContext: QueryContext;
	try {
		queryContext = parse(queryContextSchema, rawQueryContext);
	} catch (e) {
		const msg = e instanceof Error ? e.message : String(e);
		throw error(500, `Invalid query context: ${msg}`);
	}

	if (queryContext.userId !== userId) {
		throw error(500, 'Query context userId does not match session');
	}

	const ownerOrgs = memberships.filter((m) => m.role === 'owner');
	const adminOrgs = memberships.filter((m) => m.role === 'admin');
	const otherOrgs = memberships.filter((m) => m.role !== 'owner' && m.role !== 'admin');

	const rawInferredOrganizationId = await inferOrganizationIdFromUrl({ url });
	const inferredOrganizationId = rawInferredOrganizationId
		? memberships.find((m) => m.organizationId === rawInferredOrganizationId)?.organizationId
		: null;

	const defaultActiveOrganizationId =
		inferredOrganizationId ||
		session.session.activeOrganizationId ||
		ownerOrgs[0]?.organizationId ||
		adminOrgs[0]?.organizationId ||
		otherOrgs[0]?.organizationId ||
		null;

	if (!defaultActiveOrganizationId) {
		throw redirect(302, '/organization');
	}

	const organizations = memberships.map((m) => ({ organizationId: m.organizationId }));

	return {
		userId,
		defaultActiveOrganizationId,
		inferredOrganizationId,
		organizations,
		memberships: organizations,
		queryContext
	};
}
