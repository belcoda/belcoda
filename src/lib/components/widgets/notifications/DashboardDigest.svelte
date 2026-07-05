<script lang="ts">
	import * as Card from '$lib/components/ui/card/index.js';
	import { locale, t } from '$lib/index.svelte';
	import { appState, getListFilter } from '$lib/state.svelte';
	import { formatShortTimestamp } from '$lib/utils/date';
	import { formatNumber } from '$lib/utils/number';
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

	const digestFilter = $derived.by(() => ({
		...getListFilter(appState.organizationId, { pageSize: 8 }),
		status: null
	}));
	const digestQuery = $derived.by(() => z.createQuery(queries.notification.list(digestFilter)));
	const notifications = $derived(digestQuery.data ?? []);
	const displayedNotifications = $derived(
		notifications.filter((notification) => notification.status !== 'dismissed')
	);
	const unreadCount = $derived(
		displayedNotifications.filter((notification) => notification.status === 'unread').length
	);
	const recentNotifications = $derived(displayedNotifications.slice(0, 5));

	function getTypeLabel(type: string) {
		return typeLabelMap[type] ?? t`Notification`;
	}
</script>

<Card.Root>
	<Card.Header>
		<Card.Title>{t`Notifications Digest`}</Card.Title>
		<Card.Description>
			{#if unreadCount === 0}
				{t`No unread notifications`}
			{:else if unreadCount === 1}
				{t`1 unread notification`}
			{:else}
				{t`${formatNumber(unreadCount, locale.current)} unread notifications`}
			{/if}
		</Card.Description>
	</Card.Header>
	<Card.Content>
		{#if digestQuery.details.type === 'unknown'}
			<p class="text-sm text-muted-foreground">{t`Loading notifications...`}</p>
		{:else if digestQuery.details.type === 'error'}
			<p class="text-sm text-destructive">{t`Unable to load notifications.`}</p>
		{:else if recentNotifications.length === 0}
			<p class="text-sm text-muted-foreground">{t`No notifications to show right now.`}</p>
		{:else}
			<ul class="space-y-2">
				{#each recentNotifications as notification (notification.id)}
					<li class="flex items-center justify-between gap-4">
						<span class="truncate text-sm">{getTypeLabel(notification.type)}</span>
						<span class="shrink-0 text-xs text-muted-foreground">
							{notification.createdAt === null
								? t`Unknown time`
								: formatShortTimestamp(notification.createdAt, locale.current)}
						</span>
					</li>
				{/each}
			</ul>
		{/if}
	</Card.Content>
</Card.Root>
