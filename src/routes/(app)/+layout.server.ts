import { redirect } from '@sveltejs/kit';
import { getQueryContext } from '$lib/server/api/utils/auth/permissions';
import { _listOrganizationMembershipsByUserIdUnsafe } from '$lib/server/api/data/organization';
import { inferOrganizationIdFromUrl } from '$lib/server/api/utils/infer_organization';
export async function load({ locals, url }) {
	const session = locals.session;

	//this should never be needed, because it's handled in the hooks.server.ts file but helps with type safety on the client
	if (!session) {
		throw redirect(302, '/signup');
	}
	const [memberships, queryContext] = await Promise.all([
		_listOrganizationMembershipsByUserIdUnsafe({ userId: session.user.id }),
		getQueryContext(session.user.id)
	]);
	const ownerOrgs = memberships.filter((m) => m.role === 'owner');
	const adminOrgs = memberships.filter((m) => m.role === 'admin');
	const otherOrgs = memberships.filter((m) => m.role !== 'owner' && m.role !== 'admin');

	// explicit ?org= query param (validated against memberships)
	const rawOrgParam = url.searchParams.get('org');
	const queryParamOrganizationId = rawOrgParam
		? (memberships.find((m) => m.organizationId === rawOrgParam)?.organizationId ?? null)
		: null;

	// see if we can derive an organization id from the URL path
	const rawInferredOrganizationId = await inferOrganizationIdFromUrl({ url });
	const inferredOrganizationId = rawInferredOrganizationId
		? memberships.find((m) => m.organizationId === rawInferredOrganizationId)?.organizationId
		: null; //make sure the user is a member of the inferred organization
	// prioritize explicit org param, then path-inferred org, then session active org, then owner/admin/other
	const defaultActiveOrganizationId =
		queryParamOrganizationId ||
		inferredOrganizationId ||
		session.session.activeOrganizationId ||
		ownerOrgs[0]?.organizationId ||
		adminOrgs[0]?.organizationId ||
		otherOrgs[0]?.organizationId ||
		null;
	if (!defaultActiveOrganizationId) {
		return redirect(302, '/organization'); //should never happen, because the user *must* have at least one organization to load this route lol
	}
	return {
		userId: session.user.id,
		defaultActiveOrganizationId: defaultActiveOrganizationId,
		inferredOrganizationId: inferredOrganizationId,
		queryParamOrganizationId,
		memberships: memberships.map((m) => ({ organizationId: m.organizationId })),
		queryContext: queryContext
	};
}
