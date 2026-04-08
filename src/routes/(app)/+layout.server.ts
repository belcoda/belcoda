import { error, redirect } from '@sveltejs/kit';
import { parse } from 'valibot';

import { getQueryContext } from '$lib/server/api/utils/auth/permissions';
import { _listOrganizationMembershipsByUserIdUnsafe } from '$lib/server/api/data/organization';
import { inferOrganizationIdFromUrl } from '$lib/server/api/utils/infer_organization';
import { queryContextSchema, type QueryContext } from '$lib/zero/schema';

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
