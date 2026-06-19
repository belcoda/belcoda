<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { locale, t } from '$lib/index.svelte';
	import { appState, getListFilter } from '$lib/state.svelte';
	import { formatShortTimestamp } from '$lib/utils/date';
	import { mutators } from '$lib/zero/mutate/client_mutators';
	import queries from '$lib/zero/query/index';
	import { z } from '$lib/zero.svelte';

	const typeLabelMap: Record<string, string> = {
		whatsapp_unread: t`Unread WhatsApp`,
		whatsapp_message: t`WhatsApp message`,
		flow_notify_user: t`Flow notification`,
		event_signup: t`Event signup`,
		petition_signup: t`Petition signup`,
		generic: t`Notification`
	};

	const inboxFilter = $derived.by(() => ({
		...getListFilter(appState.organizationId, { pageSize: 10 }),
		status: null
	}));
	const unreadFilter = $derived.by(() => ({
		...getListFilter(appState.organizationId, { pageSize: 1 }),
		status: 'unread' as const
	}));

	const inboxQuery = $derived.by(() => z.createQuery(queries.notification.list(inboxFilter)));
	const unreadQuery = $derived.by(() => z.createQuery(queries.notification.list(unreadFilter)));
	const notifications = $derived(inboxQuery.data ?? []);
	const hasUnreadNotifications = $derived((unreadQuery.data?.length ?? 0) > 0);
	const displayedNotifications = $derived(
		notifications.filter((notification) => notification.status !== 'dismissed')
	);

	let busyIds = $state<Record<string, boolean>>({});
	let markAllBusy = $state(false);

	function getTypeLabel(type: string) {
		return typeLabelMap[type] ?? t`Notification`;
	}

	function setBusy(notificationId: string, isBusy: boolean) {
		const next = { ...busyIds };
		if (isBusy) {
			next[notificationId] = true;
		} else {
			delete next[notificationId];
		}
		busyIds = next;
	}

	async function markAsRead(notificationId: string) {
		if (busyIds[notificationId] || markAllBusy) {
			return;
		}
		setBusy(notificationId, true);
		try {
			await z.mutate(
				mutators.notification.markAsRead({
					metadata: {
						organizationId: appState.organizationId,
						notificationId
					}
				})
			);
		} finally {
			setBusy(notificationId, false);
		}
	}

	async function dismiss(notificationId: string) {
		if (busyIds[notificationId] || markAllBusy) {
			return;
		}
		setBusy(notificationId, true);
		try {
			await z.mutate(
				mutators.notification.dismiss({
					metadata: {
						organizationId: appState.organizationId,
						notificationId
					}
				})
			);
		} finally {
			setBusy(notificationId, false);
		}
	}

	async function markAllAsRead() {
		if (markAllBusy || !hasUnreadNotifications) {
			return;
		}
		markAllBusy = true;
		try {
			await z.mutate(
				mutators.notification.markAllAsRead({
					metadata: {
						organizationId: appState.organizationId
					}
				})
			);
		} finally {
			markAllBusy = false;
		}
	}
</script>

<div class="flex h-full flex-col">
	<div class="flex items-center justify-between border-b py-3 ps-4 pe-14">
		<h2 class="text-lg font-semibold">{t`Notifications`}</h2>
		<Button
			variant="ghost"
			size="sm"
			onclick={markAllAsRead}
			disabled={markAllBusy || !hasUnreadNotifications}
		>
			{t`Mark all as read`}
		</Button>
	</div>

	<div class="flex-1 overflow-y-auto">
		{#if inboxQuery.details.type === 'unknown'}
			<p class="px-4 py-6 text-sm text-muted-foreground">{t`Loading notifications...`}</p>
		{:else if inboxQuery.details.type === 'error'}
			<p class="px-4 py-6 text-sm text-destructive">{t`Unable to load notifications.`}</p>
		{:else if displayedNotifications.length === 0}
			<p class="px-4 py-6 text-sm text-muted-foreground">{t`No notifications yet.`}</p>
		{:else}
			<ul>
				{#each displayedNotifications as notification (notification.id)}
					<li class="border-b px-4 py-3">
						<div class="mb-1 flex items-center justify-between gap-2">
							<div class="flex items-center gap-2">
								<span
									class={`size-2 rounded-full ${notification.status === 'unread' ? 'bg-primary' : 'bg-muted-foreground/50'}`}
								></span>
								<p class="text-sm font-medium">{getTypeLabel(notification.type)}</p>
							</div>
							<p class="text-xs text-muted-foreground">
								{notification.createdAt === null
									? t`Unknown time`
									: formatShortTimestamp(notification.createdAt, locale.current)}
							</p>
						</div>
						<p class="mb-3 text-xs text-muted-foreground capitalize">{notification.status}</p>
						<div class="flex items-center gap-2">
							{#if notification.status === 'unread'}
								<Button
									variant="ghost"
									size="sm"
									onclick={() => markAsRead(notification.id)}
									disabled={busyIds[notification.id] || markAllBusy}
								>
									{t`Mark as read`}
								</Button>
							{/if}
							<Button
								variant="ghost"
								size="sm"
								onclick={() => dismiss(notification.id)}
								disabled={busyIds[notification.id] || markAllBusy}
							>
								{t`Dismiss`}
							</Button>
						</div>
					</li>
				{/each}
			</ul>
		{/if}
	</div>
</div>
