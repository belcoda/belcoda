<script lang="ts">
	import * as Card from '$lib/components/ui/card/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import BellIcon from '@lucide/svelte/icons/bell';
	import { locale } from '$lib/index.svelte';
	import { appState, getListFilter } from '$lib/state.svelte';
	import { formatShortTimestamp } from '$lib/utils/date';
	import queries from '$lib/zero/query/index';
	import { z } from '$lib/zero.svelte';
	import type { NotificationPayload } from '$lib/schema/notification/payload';
	import { mutators } from '$lib/zero/mutate/client_mutators';
	import CalendarDaysIcon from '@lucide/svelte/icons/calendar-days';
	import MessageCircleIcon from '@lucide/svelte/icons/message-circle';
	import FileTextIcon from '@lucide/svelte/icons/file-text';
	import { t } from '$lib/index.svelte';

	const filter = $derived.by(() => ({
		...getListFilter(appState.organizationId, { pageSize: 10 }),
		status: null
	}));

	const query = $derived.by(() => z.createQuery(queries.notification.list(filter)));
	const notifications = $derived(query.data ?? []);
	type NotificationItem = NonNullable<(typeof query)['data']>[number];
	type NotificationGroup = {
		key: string;
		type: string;
		referenceId: string;
		notifications: NotificationItem[];
		latestAt: number | null;
		personNames: string[];
		personIds: string[];
		subjectTitle: string | null;
		hasUnread: boolean;
	};

	const unreadCount = $derived(notifications.filter((n) => n.status === 'unread').length);

	function groupKey(n: NotificationItem): string {
		const payload = n.payload as NotificationPayload | null;
		switch (n.type) {
			case 'whatsapp_message':
			case 'whatsapp_unread':
				// group by person, not by individual message
				return `${n.type}:${payload?.personId ?? n.id}`;
			case 'generic':
				// each generic notification stands alone
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

	// count of groups (not raw notifications) per type. used in the digest
	const digestCounts = $derived.by(() => {
		const counts: Record<string, number> = {};
		for (const g of groups) counts[g.type] = (counts[g.type] ?? 0) + 1;
		return counts;
	});

	function formatNames(names: string[]): string {
		if (names.length === 0) return '';
		if (names.length === 1) return names[0];
		if (names.length === 2) return `${names[0]} and ${names[1]}`;
		const others = names.length - 2;
		return `${names[0]}, ${names[1]}, and ${others} other${others > 1 ? 's' : ''}`;
	}

	function subjectUrl(type: string, referenceId: string): string | null {
		switch (type) {
			case 'event_signup':
				return `/events/${referenceId}`;
			case 'petition_signup':
				return `/petitions/${referenceId}`;
			default:
				return null;
		}
	}

	function groupTimestamp(group: NotificationGroup): string {
		if (group.latestAt == null) return '';
		return formatShortTimestamp(group.latestAt, locale.current);
	}

	async function markGroupAsRead(group: NotificationGroup) {
		const unread = group.notifications.filter((n) => n.status === 'unread');
		await Promise.all(
			unread.map((n) =>
				z.mutate(
					mutators.notification.markAsRead({
						metadata: { organizationId: appState.organizationId, notificationId: n.id }
					})
				)
			)
		);
	}

	type DigestEntry = { label: string; dotClass: string };
	const digestEntries: Record<string, DigestEntry> = {
		event_signup: { label: 'signups', dotClass: 'bg-primary' },
		petition_signup: { label: 'signatures', dotClass: 'bg-violet-500' },
		whatsapp_message: { label: 'messages', dotClass: 'bg-emerald-500' },
		whatsapp_unread: { label: 'messages', dotClass: 'bg-emerald-500' },
		flow_notify_user: { label: 'alerts', dotClass: 'bg-amber-500' },
		generic: { label: 'notifications', dotClass: 'bg-muted-foreground' }
	};

	// Merged digest so whatsapp_message and whatsapp_unread share one chip
	const digest = $derived.by(() => {
		const merged: { key: string; label: string; dotClass: string; count: number }[] = [];
		const seen = new Set<string>();
		for (const [type, count] of Object.entries(digestCounts)) {
			const entry = digestEntries[type] ?? {
				label: 'notifications',
				dotClass: 'bg-muted-foreground'
			};
			// merge whatsapp variants under one chip
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
</script>

<Card.Root class="rounded-lg">
	<Card.Header class="pb-2">
		<div class="flex items-center justify-between">
			<Card.Title class="text-sm">Recent notifications</Card.Title>
			{#if unreadCount > 0}
				<span
					class="text-destructive-foreground flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-medium"
				>
					{unreadCount}
				</span>
			{/if}
		</div>
	</Card.Header>
	<Card.Content class="pt-0">
		{#if query.details.type === 'unknown'}
			<p class="py-4 text-center text-xs text-muted-foreground">Loading...</p>
		{:else if notifications.length === 0}
			<div class="flex flex-col items-center gap-1.5 py-8 text-center">
				<BellIcon class="size-6 text-muted-foreground/50" />
				<p class="text-xs text-muted-foreground">No notifications yet</p>
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
							<div class="flex items-start gap-2">
								<div
									class="flex size-[26px] shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary"
								>
									<CalendarDaysIcon class="size-3.5" />
								</div>
								<div class="min-w-0 flex-1">
									<div class="flex items-baseline gap-1.5">
										{#if subjectUrl(group.type, group.referenceId)}
											<a
												href={subjectUrl(group.type, group.referenceId)}
												class="truncate text-[12px] leading-snug font-medium hover:underline"
											>
												{group.subjectTitle ?? 'Event'}
											</a>
										{:else}
											<span class="truncate text-[12px] leading-snug font-medium"
												>{group.subjectTitle ?? 'Event'}</span
											>
										{/if}
										{#if group.notifications.length > 1}
											<span
												class="shrink-0 rounded bg-primary/10 px-1 py-px text-[10px] font-medium text-primary"
												>+{group.notifications.length}</span
											>
										{/if}
									</div>
									<p class="mt-0.5 text-[11px] leading-snug text-muted-foreground">
										{#each group.personNames.slice(0, 2) as name, i (name)}
											{#if i > 0}{i === group.personNames.length - 1 || group.personNames.length > 2
													? ', '
													: ' and '}{/if}
											{#if group.personIds[i]}
												<a
													href="/community/{group.personIds[i]}"
													class="font-medium text-foreground hover:underline">{name}</a
												>
											{:else}
												{name}
											{/if}
										{/each}
										{#if group.personNames.length > 2}
											{@const extra = group.personNames.length - 2}
											, and {extra} other{extra > 1 ? 's' : ''}
										{/if}
										{group.personNames.length > 0 ? ' signed up' : 'New signup'}
									</p>
									<div class="mt-1.5 flex items-center gap-1.5">
										<a
											href="/events/{group.referenceId}"
											onclick={() => markGroupAsRead(group)}
											class="rounded border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground hover:bg-muted"
										>
											{t`View event`}
										</a>
										<a
											href="/events/{group.referenceId}/signups"
											onclick={() => markGroupAsRead(group)}
											class="rounded border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground hover:bg-muted"
										>
											{t`View signups`}
										</a>
										<span class="ml-auto text-[10px] text-muted-foreground/70"
											>{groupTimestamp(group)}</span
										>
									</div>
								</div>
							</div>
						{:else if group.type === 'petition_signup'}
							<div class="flex items-start gap-2">
								<div
									class="flex size-[26px] shrink-0 items-center justify-center rounded-md bg-violet-500/10 text-violet-600"
								>
									<FileTextIcon class="size-3.5" />
								</div>
								<div class="min-w-0 flex-1">
									<div class="flex items-baseline gap-1.5">
										{#if subjectUrl(group.type, group.referenceId)}
											<a
												href={subjectUrl(group.type, group.referenceId)}
												class="truncate text-[12px] leading-snug font-medium hover:underline"
											>
												{group.subjectTitle ?? 'Petition'}
											</a>
										{:else}
											<span class="truncate text-[12px] leading-snug font-medium"
												>{group.subjectTitle ?? 'Petition'}</span
											>
										{/if}
										{#if group.notifications.length > 1}
											<span
												class="shrink-0 rounded bg-violet-500/10 px-1 py-px text-[10px] font-medium text-violet-600"
												>+{group.notifications.length}</span
											>
										{/if}
									</div>
									<p class="mt-0.5 text-[11px] leading-snug text-muted-foreground">
										{#each group.personNames.slice(0, 2) as name, i (name)}
											{#if i > 0}{i === group.personNames.length - 1 || group.personNames.length > 2
													? ', '
													: ' and '}{/if}
											{#if group.personIds[i]}
												<a
													href="/community/{group.personIds[i]}"
													class="font-medium text-foreground hover:underline">{name}</a
												>
											{:else}
												{name}
											{/if}
										{/each}
										{#if group.personNames.length > 2}
											{@const extra = group.personNames.length - 2}
											, and {extra} other{extra > 1 ? 's' : ''}
										{/if}
										{group.personNames.length > 0 ? ' signed' : 'New signature'}
									</p>
									<div class="mt-1.5 flex items-center gap-1.5">
										<a
											href="/petitions/{group.referenceId}"
											onclick={() => markGroupAsRead(group)}
											class="rounded border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground hover:bg-muted"
										>
											{t`View petition`}
										</a>
										<span class="ml-auto text-[10px] text-muted-foreground/70"
											>{groupTimestamp(group)}</span
										>
									</div>
								</div>
							</div>
						{:else if group.type === 'whatsapp_message' || group.type === 'whatsapp_unread'}
							<div class="flex items-start gap-2">
								<div
									class="flex size-[26px] shrink-0 items-center justify-center rounded-md bg-emerald-500/10 text-emerald-600"
								>
									<MessageCircleIcon class="size-3.5" />
								</div>
								<div class="min-w-0 flex-1">
									{#if group.personIds[0]}
										<a
											href="/community/{group.personIds[0]}"
											class="text-[12px] leading-snug font-medium hover:underline"
										>
											{group.personNames[0] ?? 'Unknown'}
										</a>
									{:else}
										<span class="text-[12px] leading-snug font-medium"
											>{group.personNames[0] ?? 'Unknown'}</span
										>
									{/if}
									<p class="mt-0.5 text-[11px] leading-snug text-muted-foreground">
										{t`Sent a WhatsApp message`}
									</p>
									<div class="mt-1.5 flex items-center gap-1.5">
										{#if group.personIds[0]}
											<a
												href="/community/{group.personIds[0]}"
												onclick={() => markGroupAsRead(group)}
												class="rounded border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground hover:bg-muted"
											>
												{t`View person`}
											</a>
										{/if}
										<span class="ml-auto text-[10px] text-muted-foreground/70"
											>{groupTimestamp(group)}</span
										>
									</div>
								</div>
							</div>
						{:else}
							<p class="text-xs {group.hasUnread ? 'font-medium' : 'text-muted-foreground'}">
								{(group.notifications[0]?.payload as { message?: string } | null)?.message ??
									'Notification'}
							</p>
							<p class="mt-0.5 text-[10px] text-muted-foreground">{groupTimestamp(group)}</p>
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
