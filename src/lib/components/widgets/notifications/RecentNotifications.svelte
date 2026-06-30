<script lang="ts">
	import * as Card from '$lib/components/ui/card/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import BellIcon from '@lucide/svelte/icons/bell';
	import { appState, getListFilter } from '$lib/state.svelte';
	import { formatShortTimestamp } from '$lib/utils/date';
	import { locale, t } from '$lib/index.svelte';
	import queries from '$lib/zero/query/index';
	import { z } from '$lib/zero.svelte';
	import type { NotificationPayload } from '$lib/schema/notification/payload';
	import type { NotificationGroup } from './types';
	import NotificationGroupEvent from './NotificationGroupEvent.svelte';
	import NotificationGroupWhatsApp from './NotificationGroupWhatsApp.svelte';
	import NotificationGroupPetition from './NotificationGroupPetition.svelte';

	const filter = $derived.by(() => ({
		...getListFilter(appState.organizationId, { pageSize: 10 }),
		status: null
	}));

	const query = $derived.by(() => z.createQuery(queries.notification.list(filter)));
	const notifications = $derived(query.data ?? []);
	type NotificationItem = NonNullable<(typeof query)['data']>[number];

	const unreadCount = $derived(notifications.filter((n) => n.status === 'unread').length);

	function groupKey(n: NotificationItem): string {
		const payload = n.payload as NotificationPayload | null;
		switch (n.type) {
			case 'whatsapp_message':
			case 'whatsapp_unread':
				return `${n.type}:${payload?.personId ?? n.id}`;
			case 'generic':
				return n.id;
			default:
				return `${n.type}:${n.referenceId}`;
		}
	}

	const groups = $derived.by(() => {
		const map = new Map<string, NotificationGroup>();
		for (const n of notifications) {
			const key = groupKey(n);
			const payload = n.payload as NotificationPayload | null;
			if (!map.has(key)) {
				map.set(key, {
					key,
					type: n.type,
					referenceId: n.referenceId,
					notifications: [],
					latestAt: n.createdAt,
					personNames: [],
					personIds: [],
					subjectTitle: payload?.subjectTitle ?? null,
					hasUnread: false
				});
			}
			const group = map.get(key)!;
			group.notifications.push(n);
			if (n.createdAt != null && (group.latestAt == null || n.createdAt > group.latestAt)) {
				group.latestAt = n.createdAt;
			}
			if (n.status === 'unread') group.hasUnread = true;
			const name = payload?.personName;
			const pid = payload?.personId;
			if (name && !group.personNames.includes(name)) group.personNames.push(name);
			if (pid && !group.personIds.includes(pid)) group.personIds.push(pid);
		}
		return [...map.values()].sort((a, b) => (b.latestAt ?? 0) - (a.latestAt ?? 0));
	});

	const digestCounts = $derived.by(() => {
		const counts: Record<string, number> = {};
		for (const g of groups) counts[g.type] = (counts[g.type] ?? 0) + 1;
		return counts;
	});

	type DigestEntry = { label: string; dotClass: string };
	const digestEntries: Record<string, DigestEntry> = {
		event_signup: { label: t`signups`, dotClass: 'bg-primary' },
		petition_signup: { label: t`signatures`, dotClass: 'bg-violet-500' },
		whatsapp_message: { label: t`messages`, dotClass: 'bg-emerald-500' },
		whatsapp_unread: { label: t`messages`, dotClass: 'bg-emerald-500' },
		flow_notify_user: { label: t`alerts`, dotClass: 'bg-amber-500' },
		generic: { label: t`notifications`, dotClass: 'bg-muted-foreground' }
	};

	const digest = $derived.by(() => {
		const merged: { key: string; label: string; dotClass: string; count: number }[] = [];
		const seen = new Set<string>();
		for (const [type, count] of Object.entries(digestCounts)) {
			const entry = digestEntries[type] ?? {
				label: t`notifications`,
				dotClass: 'bg-muted-foreground'
			};
			const chipKey = type.startsWith('whatsapp') ? 'whatsapp' : type;
			const existing = merged.find((d) => d.key === chipKey);
			if (existing) {
				existing.count += count;
			} else if (!seen.has(chipKey)) {
				seen.add(chipKey);
				merged.push({ key: chipKey, label: entry.label, dotClass: entry.dotClass, count });
			}
		}
		return merged;
	});

	function fallbackTimestamp(group: NotificationGroup): string {
		if (group.latestAt == null) return '';
		return formatShortTimestamp(group.latestAt, locale.current);
	}
</script>

<Card.Root class="rounded-lg">
	<Card.Header class="pb-2">
		<div class="flex items-center justify-between">
			<Card.Title class="text-sm">{t`Recent notifications`}</Card.Title>
			{#if unreadCount > 0}
				<span
					class="flex h-5 min-w-5 items-center justify-center rounded-full bg-orange-300 px-1 text-[10px] font-medium text-orange-700"
				>
					{unreadCount}
				</span>
			{/if}
		</div>
	</Card.Header>
	<Card.Content class="pt-0">
		{#if query.details.type === 'unknown'}
			<p class="py-4 text-center text-xs text-muted-foreground">{t`Loading...`}</p>
		{:else if notifications.length === 0}
			<div class="flex flex-col items-center gap-1.5 py-8 text-center">
				<BellIcon class="size-6 text-muted-foreground/50" />
				<p class="text-xs text-muted-foreground">{t`No notifications yet`}</p>
			</div>
		{:else}
			{#if digest.length > 0}
				<div
					class="mb-3 flex flex-wrap items-center gap-x-2 gap-y-1 rounded-md bg-muted/50 px-2.5 py-1.5"
				>
					{#each digest as chip, i (chip.key)}
						{#if i > 0}<span class="text-[10px] text-muted-foreground">·</span>{/if}
						<span class="flex items-center gap-1 text-[11px] text-muted-foreground">
							<span class="size-1.5 rounded-full {chip.dotClass}"></span>
							{chip.count}
							{chip.label}
						</span>
					{/each}
				</div>
			{/if}

			<ul class="divide-y">
				{#each groups as group (group.key)}
					<li class="py-2.5 first:pt-0">
						{#if group.type === 'event_signup'}
							<NotificationGroupEvent {group} />
						{:else if group.type === 'petition_signup'}
							<NotificationGroupPetition {group} />
						{:else if group.type === 'whatsapp_message' || group.type === 'whatsapp_unread'}
							<NotificationGroupWhatsApp {group} />
						{:else}
							<p class="text-xs {group.hasUnread ? 'font-medium' : 'text-muted-foreground'}">
								{(group.notifications[0]?.payload as { message?: string } | null)?.message ??
									t`Notification`}
							</p>
							<p class="mt-0.5 text-[10px] text-muted-foreground">{fallbackTimestamp(group)}</p>
						{/if}
					</li>
				{/each}
			</ul>

			<Button variant="ghost" size="sm" href="/notifications" class="mt-2 h-7 w-full text-xs">
				{t`View all`}
			</Button>
		{/if}
	</Card.Content>
</Card.Root>
