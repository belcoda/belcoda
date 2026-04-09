import type { QueryContext } from '$lib/zero/schema';
import { type ListFilter } from '$lib/schema/helpers';

import { z } from '$lib/zero.svelte';
import queries from '$lib/zero/query/index';
import { structuredClone } from '$lib/utils/structuredClone';

const DEFAULT_LIST_FILTER: ListFilter = {
	organizationId: '',
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

class AppState {
	#organizationId = $state<string | null>(null);
	#activeTeamId = $state<string | null>(null);
	#userId = $state<string | null>(null);
	#queryContext: QueryContext | null = $state(null);

	#organizations = $derived(
		this.#queryContext ? z.createQuery(queries.organization.list({})) : null
	);
	#activeOrganization = $derived.by(() => {
		if (!this.#organizationId) {
			return null;
		}
		if (!this.#queryContext) {
			return null;
		}
		return z.createQuery(queries.organization.read({ organizationId: this.#organizationId }));
	});

	#adminOrgs = $derived(
		this.#organizations?.data
			?.filter((organization) =>
				organization.memberships.some((membership) => membership.role === 'admin')
			)
			?.map((organization) => organization.id) ?? []
	);
	#ownerOrgs = $derived(
		this.#organizations?.data
			?.filter((organization) =>
				organization.memberships.some((membership) => membership.role === 'owner')
			)
			?.map((organization) => organization.id) ?? []
	);
	#myTeams = $derived.by(() => {
		if (!this.#queryContext || !this.#userId || !this.#organizationId) {
			return null;
		}
		return z.createQuery(
			queries.team.listMyTeams({
				userId: this.#userId,
				organizationId: this.#organizationId
			})
		);
	});

	#organizationUsers = $derived.by(() => {
		if (!this.#queryContext || !this.#organizationId) {
			return null;
		}
		return z.createQuery(queries.user.list(getListFilter(this.#organizationId)));
	});

	#user = $derived.by(() => {
		if (!this.#queryContext || !this.#userId) {
			return null;
		}
		return z.createQuery(queries.user.read({ userId: this.#userId }));
	});

	#role = $derived(this.#activeOrganization?.data?.memberships[0].role ?? null);
	#isAdmin = $derived(this.#role === 'admin');
	#isOwner = $derived(this.#role === 'owner');
	#isAdminOrOwner = $derived(this.#isAdmin || this.#isOwner);

	init({
		userId,
		organizationId,
		queryContext
	}: {
		userId: string;
		organizationId: string;
		queryContext: QueryContext;
	}) {
		this.#userId = userId;
		this.#organizationId = organizationId;
		this.#queryContext = queryContext;
	}

	get organizationId() {
		if (!this.#organizationId) {
			throw new Error('Organization ID is not set');
		}
		return this.#organizationId;
	}
	set organizationId(newOrganizationId: string) {
		this.#organizationId = newOrganizationId;
	}

	get activeTeamId() {
		return this.#activeTeamId;
	}

	set activeTeamId(newActiveTeamId: string | null) {
		this.#activeTeamId = newActiveTeamId;
	}

	get userId() {
		if (!this.#userId) {
			throw new Error('User ID is not set');
		}
		return this.#userId;
	}

	get queryContext() {
		if (!this.#queryContext) {
			throw new Error('Query context is not set');
		}
		return this.#queryContext;
	}

	get organizations() {
		if (!this.#organizations) {
			throw new Error('Organizations are not set');
		}
		return this.#organizations;
	}
	get activeOrganization() {
		if (!this.#activeOrganization) {
			throw new Error('Active organization is not set');
		}
		return this.#activeOrganization;
	}

	get organizationUsers() {
		if (!this.#organizationUsers) {
			throw new Error('Organization users are not set');
		}
		return this.#organizationUsers;
	}
	get user() {
		if (!this.#user) {
			throw new Error('User is not set');
		}
		return this.#user;
	}
	get myTeams() {
		if (!this.#myTeams) {
			throw new Error('My teams are not set');
		}
		return this.#myTeams;
	}

	get role() {
		if (!this.#role) {
			throw new Error('Role is not set');
		}
		return this.#role;
	}
	get isAdmin() {
		return this.#isAdmin;
	}
	get isOwner() {
		return this.#isOwner;
	}
	get isAdminOrOwner() {
		return this.#isAdminOrOwner;
	}
}

export const appState = new AppState();
