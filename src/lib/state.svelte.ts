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
import type { Schema } from '$lib/zero/schema';
export const STARTING_ORGANIZATION_ID = 'STARTING_ORGANIZATION_ID' as const;
export const STARTING_STATE_USER_ID = 'STARTING_STATE_USER_ID' as const;

import { type Query } from '@rocicorp/zero';
import type { ReadOrganizationZero } from './schema/organization';

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
export class AuthStore {
	// 1. Reactive State Variables (as class properties)

	locale: Locale;

	organizationId: string;

	userId: string;

	usersListFilter: ListFilter;

	activeTeamId: string | null; // used in filtering content when teamId is set

	authTeams: string[];
	adminOrgs: string[];
	ownerOrgs: string[];
	queryContext: QueryContext;

	constructor({
		session,
		defaultActiveOrganizationId,
		queryContext
	}: {
		session: App.Locals['session'];
		defaultActiveOrganizationId: string;
		queryContext: QueryContext;
	}) {
		if (!session) {
			throw new Error('Session is required');
		}
		this.locale = $state('en');
		this.userId = $state(session.user.id);
		this.organizationId = $state(defaultActiveOrganizationId);
		this.activeTeamId = null;
		this.authTeams = $state(queryContext.authTeams);
		this.adminOrgs = $state(queryContext.adminOrgs);
		this.ownerOrgs = $state(queryContext.ownerOrgs);
		this.usersListFilter = $state(getListFilter(defaultActiveOrganizationId));
		this.queryContext = $derived({
			userId: this.userId,
			authTeams: this.authTeams,
			adminOrgs: this.adminOrgs,
			ownerOrgs: this.ownerOrgs
		});
	}

	get organizations() {
		return z.createQuery(listOrganizations(this.queryContext, {}));
	}

	get activeOrganization() {
		return z.createQuery(
			readOrganization(this.queryContext, { organizationId: this.organizationId })
		);
	}

	get role() {
		return this.activeOrganization.data?.memberships[0].role;
	}

	get isAdmin() {
		return this.role === 'admin';
	}

	get isOwner() {
		return this.role === 'owner';
	}

	get isAdminOrOwner() {
		return this.isAdmin || this.isOwner;
	}

	get organizationUsers() {
		return z.createQuery(listUsers(this.queryContext, this.usersListFilter));
	}

	get myTeams() {
		return;
		z.createQuery(
			listMyTeams(this.queryContext, { userId: this.userId, organizationId: this.organizationId })
		);
	}

	get user() {
		return z.createQuery(readUser(this.queryContext, { userId: this.userId }));
	}

	setLocale = (newLocale: Locale) => {
		this.locale = newLocale;
	};

	setOrganizationId = (newOrganizationId: string) => {
		this.organizationId = newOrganizationId;
		this.usersListFilter.organizationId = newOrganizationId;
	};

	setUserId = (newUserId: string) => {
		this.userId = newUserId;
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
}

export function createAppState({
	session,
	initialQueryContext,
	defaultActiveOrganizationId
}: {
	session: App.Locals['session'];
	initialQueryContext: QueryContext;
	defaultActiveOrganizationId: string;
}) {
	if (!session) {
		throw new Error('Session is required');
	}

	let locale: Locale = $state('en');
	const setLocale = (newLocale: Locale) => {
		locale = newLocale;
	};

	let organizationId: string = $state(defaultActiveOrganizationId);
	const setOrganizationId = (newOrganizationId: string) => {
		organizationId = newOrganizationId;
	};

	let userId: string = $state(session.user.id); //no set function needed here, it's always gonna be the same user...
	let usersListFilter: ListFilter = $state(getListFilter(defaultActiveOrganizationId));
	const setUsersListFilter = (newUsersListFilter: ListFilter) => {
		usersListFilter = newUsersListFilter;
	};

	let activeTeamId: string | null = $state(null);
	const setActiveTeamId = (newActiveTeamId: string | null) => {
		activeTeamId = newActiveTeamId;
	};

	let queryContext: QueryContext = $state(initialQueryContext);
	const setQueryContext = (newQueryContext: QueryContext) => {
		queryContext = newQueryContext;
	};
	let organizations = $derived(z.createQuery(listOrganizations(queryContext, {})));
	let activeOrganization = $derived(
		z.createQuery(readOrganization(queryContext, { organizationId: organizationId }))
	);

	let adminOrgs = $derived.by(() => {
		return organizations.data
			?.filter((organization) =>
				organization.memberships.some((membership) => membership.role === 'admin')
			)
			.map((organization) => organization.id);
	});
	let ownerOrgs = $derived.by(() => {
		return organizations.data
			?.filter((organization) =>
				organization.memberships.some((membership) => membership.role === 'owner')
			)
			.map((organization) => organization.id);
	});

	let role = $derived(activeOrganization.data?.memberships[0].role);
	let isAdmin = $derived(role === 'admin');
	let isOwner = $derived(role === 'owner');
	let isAdminOrOwner = $derived(isAdmin || isOwner);
	let organizationUsers = $derived(z.createQuery(listUsers(queryContext, usersListFilter)));
	let myTeams = $derived(
		z.createQuery(listMyTeams(queryContext, { userId: userId, organizationId: organizationId }))
	);
	let user = $derived(z.createQuery(readUser(queryContext, { userId: userId })));

	return {
		get locale() {
			return locale;
		},
		setLocale,

		get organizationId() {
			return organizationId;
		},
		setOrganizationId,

		get userId() {
			return userId;
		},

		get usersListFilter() {
			return usersListFilter;
		},
		setUsersListFilter,

		get activeTeamId() {
			return activeTeamId;
		},
		setActiveTeamId,

		get queryContext() {
			return queryContext;
		},
		setQueryContext,

		get organizations() {
			return organizations;
		},
		get activeOrganization() {
			return activeOrganization;
		},
		get role() {
			return role;
		},
		get isAdmin() {
			return isAdmin;
		},
		get isOwner() {
			return isOwner;
		},
		get isAdminOrOwner() {
			return isAdminOrOwner;
		},
		get organizationUsers() {
			return organizationUsers;
		},
		get myTeams() {
			return myTeams;
		},
		get user() {
			return user;
		}
	};
}
import { createContext } from 'svelte';
export const [getAppState, setAppState] = createContext<ReturnType<typeof createAppState>>();
