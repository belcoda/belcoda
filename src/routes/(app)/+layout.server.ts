import { redirect } from '@sveltejs/kit';
import { getQueryContext } from '$lib/server/api/utils/auth/permissions';
import { _listOrganizationMembershipsByUserIdUnsafe } from '$lib/server/api/data/organization';
export async function load({ locals }) {
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

	// prioritize the active organization id, then the owner organizations, then the admin organizations, then the other organizations
	const defaultActiveOrganizationId =
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
		queryContext: queryContext
	};
}
