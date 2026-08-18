import type { QueryContext } from '$lib/zero/schema';
import { type ListFilter } from '$lib/schema/helpers';
import type { NotificationPayload } from '$lib/schema/notification/payload';
import {
	defaultMemberSettings,
	memberOnboardingIsComplete,
	type ResolvedMemberSettingsSchema
} from '$lib/schema/member/settings';
import { SvelteMap } from 'svelte/reactivity';

import { z } from '$lib/zero.svelte';
import queries from '$lib/zero/query/index';
import { structuredClone } from '$lib/utils/structuredClone';

const DEFAULT_LIST_FILTER: ListFilter = {
	organizationId: '',
	teamId: null,
	pageSize: 25,
	searchString: null,
	cursor: null,
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
	#activeWhatsappAccountId = $state<string | null>(null);
	#memberSettingsByOrganizationId = $state<Record<string, ResolvedMemberSettingsSchema>>({});

	#whatsappAccounts = $derived.by(() => {
		if (!this.#organizationId) {
			return null;
		}
		const q = z.createQuery(
			queries.whatsappAccount.list({ organizationId: this.#organizationId, isDeleted: false })
		);
		return q;
	});

	#hasAppOrganizationContext = $state(false);

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

	#notifications = $derived.by(() => {
		if (!this.#queryContext || !this.#organizationId) {
			return null;
		}
		return z.createQuery(
			queries.notification.list({
				...getListFilter(this.#organizationId, { pageSize: 200 }),
				status: null
			})
		);
	});
	#unreadNotifications = $derived.by(() => {
		if (!this.#queryContext || !this.#organizationId) {
			return null;
		}
		return z.createQuery(
			queries.notification.list({
				...getListFilter(this.#organizationId, { pageSize: 200 }),
				status: 'unread' as const
			})
		);
	});
	#notificationItems = $derived(this.#notifications?.data ?? []);
	#unreadNotificationItems = $derived(this.#unreadNotifications?.data ?? []);
	#unreadNotificationCount = $derived(this.#unreadNotificationItems.length);
	#hasUnreadNotifications = $derived(this.#unreadNotificationCount > 0);
	#unreadWhatsappMessageCountsByPersonId = $derived.by(() => {
		const counts = new SvelteMap<string, number>();
		for (const notification of this.#unreadNotificationItems) {
			if (notification.type !== 'whatsapp_message' && notification.type !== 'whatsapp_unread') {
				continue;
			}
			const payload = notification.payload as NotificationPayload | null;
			const personId =
				payload?.personId ??
				(notification.type === 'whatsapp_unread' ? notification.referenceId : null);
			if (personId) {
				counts.set(personId, (counts.get(personId) ?? 0) + 1);
			}
		}
		return counts;
	});

	#user = $derived.by(() => {
		if (!this.#queryContext || !this.#userId) {
			return null;
		}
		return z.createQuery(queries.user.read({ userId: this.#userId }));
	});

	#role = $derived.by(() => {
		const memberships = this.#activeOrganization?.data?.memberships;
		const userId = this.#userId;
		if (!memberships?.length || !userId) {
			return null;
		}
		return memberships.find((m) => m.userId === userId)?.role ?? null;
	});
	#isAdmin = $derived(this.#role === 'admin');
	#isOwner = $derived(this.#role === 'owner');
	#isAdminOrOwner = $derived(this.#isAdmin || this.#isOwner);
	#memberId = $derived.by(() => {
		const memberships = this.#activeOrganization?.data?.memberships;
		const userId = this.#userId;
		if (!memberships || !userId) {
			return null;
		}
		return memberships.find((membership) => membership.userId === userId)?.id ?? null;
	});

	init({
		userId,
		organizationId,
		queryContext,
		memberSettingsByOrganizationId
	}: {
		userId: string;
		organizationId: string;
		queryContext: QueryContext;
		memberSettingsByOrganizationId: Record<string, ResolvedMemberSettingsSchema>;
	}) {
		this.#userId = userId;
		this.#organizationId = organizationId;
		this.#queryContext = queryContext;
		this.#memberSettingsByOrganizationId = memberSettingsByOrganizationId;
		this.#hasAppOrganizationContext = true;
	}

	clearOrganizationContext() {
		this.#organizationId = null;
		this.#activeTeamId = null;
		this.#queryContext = null;
		this.#memberSettingsByOrganizationId = {};
		this.#hasAppOrganizationContext = false;
	}

	/**
	 * Safe gate for `(app)` layout: does not use throwing getters. True when core list/read
	 * queries have reached a complete materialized state.
	 */
	get layoutBootstrapComplete(): boolean {
		if (!this.#queryContext || !this.#userId || !this.#organizationId) {
			return false;
		}
		const userQ = this.#user;
		const orgsQ = this.#organizations;
		const activeQ = this.#activeOrganization;
		if (!userQ || !orgsQ || !activeQ) {
			return false;
		}
		return (
			userQ.details.type === 'complete' &&
			orgsQ.details.type === 'complete' &&
			activeQ.details.type === 'complete'
		);
	}

	get optionalOrganizationId() {
		return this.#organizationId;
	}

	get appOrganizationContextId() {
		return this.#hasAppOrganizationContext ? this.#organizationId : null;
	}

	get organizationId() {
		if (!this.#organizationId) {
			throw new Error('Organization ID is not set');
		}
		return this.#organizationId;
	}
	set organizationId(newOrganizationId: string) {
		this.#organizationId = newOrganizationId;
		this.#activeWhatsappAccountId = null;
	}

	get memberSettings() {
		if (!this.#organizationId) return defaultMemberSettings();
		return this.#memberSettingsByOrganizationId[this.#organizationId] ?? defaultMemberSettings();
	}

	get memberOnboarding() {
		return this.memberSettings.onboarding;
	}

	get memberNeedsOnboarding() {
		return !memberOnboardingIsComplete(this.memberOnboarding);
	}

	get activeWhatsappAccountId() {
		return this.#activeWhatsappAccountId;
	}

	set activeWhatsappAccountId(newActiveWhatsappAccountId: string | null) {
		this.#activeWhatsappAccountId = newActiveWhatsappAccountId;
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
	get notifications() {
		if (!this.#notifications) {
			throw new Error('Notifications are not set');
		}
		return this.#notifications;
	}
	get notificationItems() {
		return this.#notificationItems;
	}
	get unreadNotifications() {
		if (!this.#unreadNotifications) {
			throw new Error('Unread notifications are not set');
		}
		return this.#unreadNotifications;
	}
	get unreadNotificationItems() {
		return this.#unreadNotificationItems;
	}
	get unreadNotificationCount() {
		return this.#unreadNotificationCount;
	}
	get hasUnreadNotifications() {
		return this.#hasUnreadNotifications;
	}
	get unreadWhatsappMessageCountsByPersonId() {
		return this.#unreadWhatsappMessageCountsByPersonId;
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

	get whatsappAccounts() {
		if (!this.#whatsappAccounts) {
			throw new Error('Whatsapp accounts are not set');
		}
		return this.#whatsappAccounts;
	}

	get whatsappAccountsUsableByCurrentUser() {
		if (!this.#whatsappAccounts) {
			throw new Error('Whatsapp accounts are not set');
		}
		//filter out all accounts of type 'user' which do not belong to the current user
		const filteredArray =
			this.#whatsappAccounts.data?.filter(
				(account) => account.referenceId === this.#userId || account.scope === 'organization'
			) ?? [];
		//sort by scope with user accounts first
		filteredArray.sort((a, b) => {
			if (a.scope === 'user' && b.scope !== 'user') {
				return -1;
			}
			if (a.scope !== 'user' && b.scope === 'user') {
				return 1;
			}
			return 0;
		});
		return filteredArray;
	}

	get role() {
		if (!this.#role) {
			throw new Error('Role is not set');
		}
		return this.#role;
	}
	get memberId() {
		if (!this.#memberId) {
			throw new Error('Member ID is not set');
		}
		return this.#memberId;
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
