import { redirect } from '@sveltejs/kit';
import { getQueryContext } from '$lib/server/api/utils/auth/permissions';
import { listOrganizationsByUserId } from '$lib/server/api/data/organization';
export async function load({ locals }) {
	const session = locals.session;

	//this should never be needed, because it's handled in the hooks.server.ts file but helps with type safety on the client
	if (!session) {
		throw redirect(302, '/signup');
	}
	const [organizations, queryContext] = await Promise.all([
		listOrganizationsByUserId({ userId: session.user.id }),
		getQueryContext(session.user.id)
	]);
	let defaultActiveOrganizationId: string | null = null;
	if (session.session.activeOrganizationId) {
		defaultActiveOrganizationId = session.session.activeOrganizationId;
	} else {
		defaultActiveOrganizationId = queryContext.ownerOrgs[0];
		if (!defaultActiveOrganizationId) {
			defaultActiveOrganizationId = queryContext.adminOrgs[0];
		}
		if (!defaultActiveOrganizationId) {
			defaultActiveOrganizationId = organizations[0];
		}
		if (!defaultActiveOrganizationId) {
			return redirect(302, '/organization');
		}
	}
	return {
		session: session,
		organizations: organizations,
		defaultActiveOrganizationId: defaultActiveOrganizationId,
		queryContext: queryContext
	};
}
