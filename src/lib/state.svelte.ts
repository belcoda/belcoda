import { z } from '$lib/zero.svelte';
import { readOrganization } from '$lib/zero/query/organizations/read';
import { listOrganizations } from '$lib/zero/query/organizations/list';
import { listMyTeams } from '$lib/zero/query/team/listMyTeams';
import { listUsers } from '$lib/zero/query/user/list';
import { readUser } from '$lib/zero/query/user/read';
import { type Locale } from '$lib/utils/language';
import { type ListFilter } from '$lib/schema/helpers';
import type { QueryContext } from '$lib/zero/schema';
import { get } from '$lib/utils/http';
import { queryContextSchema } from '$lib/zero/schema';
export const STARTING_ORGANIZATION_ID = 'STARTING_ORGANIZATION_ID' as const;
export const STARTING_STATE_USER_ID = 'STARTING_STATE_USER_ID' as const;
const DEFAULT_LIST_FILTER: ListFilter = {
	organizationId: STARTING_ORGANIZATION_ID,
	teamId: null,
	pageSize: 25,
	searchString: null,
	startAfter: null,
	isDeleted: null,
	excludedIds: []
};
export function getListFilter(
	organizationId: string,
	partialFilter: Partial<ListFilter> = {}
): ListFilter {
	const filter = structuredClone({ ...DEFAULT_LIST_FILTER, ...partialFilter, organizationId });
	return filter;
}

// Define the class that holds all your state and logic
class AuthStore {
	// 1. Reactive State Variables (as class properties)

	locale = $state<Locale>('en');

	organizationId = $state<string>(STARTING_ORGANIZATION_ID);

	userId = $state<string>(STARTING_STATE_USER_ID);

	usersListFilter = $state<ListFilter>(getListFilter(this.organizationId));

	activeTeamId = $state<string | null>(null); // used in filtering content when teamId is set

	authTeams = $state<string[]>([]);
	adminOrgs = $state<string[]>([]);
	ownerOrgs = $state<string[]>([]);

	queryContext = $derived({
		userId: this.userId,
		authTeams: this.authTeams,
		adminOrgs: this.adminOrgs,
		ownerOrgs: this.ownerOrgs
	});

	organizations = z.createQuery(
		listOrganizations(this.queryContext, {}),
		false // don't enable the query until we have a userId loaded...
	);

	activeOrganization = z.createQuery(
		readOrganization(this.queryContext, { organizationId: this.organizationId }),
		false // don't enable the query until we have an organizationId loaded...
	);

	role = $derived(this.activeOrganization.data?.memberships[0].role);
	isAdmin = $derived(this.role === 'admin');
	isOwner = $derived(this.role === 'owner');
	isAdminOrOwner = $derived(this.isAdmin || this.isOwner);

	organizationUsers = z.createQuery(
		listUsers(this.queryContext, this.usersListFilter),
		false // don't enable the query until we have a userId loaded...
	);

	myTeams = z.createQuery(
		listMyTeams(this.queryContext, { userId: this.userId, organizationId: this.organizationId })
	);

	user = z.createQuery(readUser(this.queryContext, { userId: this.userId }));

	// 2. Actions (mutators)

	setLocale = (newLocale: Locale) => {
		this.locale = newLocale;
	};

	setOrganizationId = (newOrganizationId: string) => {
		this.organizationId = newOrganizationId;
		this.usersListFilter.organizationId = newOrganizationId;
		this.organizations.updateQuery(listOrganizations(this.queryContext, {}), true);
		this.activeOrganization.updateQuery(
			readOrganization(this.queryContext, { organizationId: newOrganizationId }),
			true
		);
		this.organizationUsers.updateQuery(listUsers(this.queryContext, this.usersListFilter), true);
		this.myTeams.updateQuery(
			listMyTeams(this.queryContext, { userId: this.userId, organizationId: newOrganizationId }),
			true
		);
	};

	setUserId = (newUserId: string) => {
		this.userId = newUserId;
		this.user.updateQuery(readUser(this.queryContext, { userId: newUserId }));
		this.organizations.updateQuery(listOrganizations(this.queryContext, {}), true);
		this.activeOrganization.updateQuery(
			readOrganization(this.queryContext, { organizationId: this.organizationId }),
			true
		);
		this.organizationUsers.updateQuery(listUsers(this.queryContext, this.usersListFilter), true);
		this.myTeams.updateQuery(
			listMyTeams(this.queryContext, { userId: newUserId, organizationId: this.organizationId }),
			true
		);
	};

	setActiveTeamId = (newTeamId: string | null) => {
		this.activeTeamId = newTeamId;
		// No need to update anything else, because the teamId isn't relevant for the user, org and other related queries...
	};

	setQueryContext = (newQueryContext: QueryContext) => {
		this.userId = newQueryContext.userId;
		this.authTeams = newQueryContext.authTeams;
		this.adminOrgs = newQueryContext.adminOrgs;
		this.ownerOrgs = newQueryContext.ownerOrgs;
	};

	async loadQueryContext() {
		const queryContext = await get({
			path: '/api/utils/auth/permissions',
			schema: queryContextSchema
		});
		this.setQueryContext(queryContext);
	}
}

// Singleton instance of the store
export const appState = new AuthStore();
