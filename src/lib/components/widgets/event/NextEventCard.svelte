<script lang="ts">
	import * as Card from '$lib/components/ui/card/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import ClockIcon from '@lucide/svelte/icons/clock';
	import MapPinIcon from '@lucide/svelte/icons/map-pin';
	import MessageCircleIcon from '@lucide/svelte/icons/message-circle';
	import Share2Icon from '@lucide/svelte/icons/share-2';
	import UsersIcon from '@lucide/svelte/icons/users';
	import { locale } from '$lib/index.svelte';
	import { appState, getListFilter } from '$lib/state.svelte';
	import { renderEventTime } from '$lib/utils/date';
	import queries from '$lib/zero/query/index';
	import { z } from '$lib/zero.svelte';

	const eventFilter = $derived.by(() => ({
		...getListFilter(appState.organizationId, { pageSize: 1 }),
		status: 'published' as const,
		dateRange: { start: Date.now() }
	}));

	const eventQuery = $derived.by(() => z.createQuery(queries.event.list(eventFilter)));
	const event = $derived(eventQuery.data?.[0] ?? null);

	const signupsQuery = $derived.by(() => {
		if (!event?.id) return null;
		return z.createQuery(
			queries.event.signups({ eventId: event.id, includeDeleted: false, includeIncomplete: false })
		);
	});
	const signupCount = $derived(signupsQuery?.data?.length ?? 0);

	const eventTime = $derived.by(() => {
		if (!event) return null;
		return renderEventTime(event.startsAt, event.endsAt, locale.current, event.timezone);
	});

	const startDate = $derived.by(() => {
		if (!event) return null;
		const d = new Date(event.startsAt);
		return {
			day: d.toLocaleDateString('en-GB', { day: '2-digit', timeZone: event.timezone }),
			month: d.toLocaleDateString('en-GB', { month: 'short', timeZone: event.timezone })
		};
	});

	const location = $derived.by(() => {
		if (!event) return null;
		if (event.addressLine1) {
			const parts = [event.addressLine1, event.locality].filter(Boolean);
			return parts.join(', ');
		}
		if (event.onlineLink) return 'Online';
		return null;
	});

	const hasWhatsApp = $derived(!!event?.settings?.whatsappFlowId);
	const capacityPct = $derived.by(() => {
		if (!event?.maxSignups) return null;
		return Math.min(100, Math.round((signupCount / event.maxSignups) * 100));
	});
</script>

{#if eventQuery.details.type === 'unknown'}
	<Card.Root class="rounded-lg">
		<Card.Content class="flex items-center justify-center py-10">
			<p class="text-sm text-muted-foreground">Loading...</p>
		</Card.Content>
	</Card.Root>
{:else if !event}
	<Card.Root class="rounded-lg">
		<Card.Content class="flex flex-col items-center gap-2 py-10 text-center">
			<p class="text-sm font-medium">No upcoming events</p>
			<p class="text-xs text-muted-foreground">Published events will appear here.</p>
			<Button href="/events/new" size="sm" class="mt-2">Create an event</Button>
		</Card.Content>
	</Card.Root>
{:else}
	<Card.Root class="rounded-lg">
		<Card.Header class="pb-3">
			<div class="flex items-center justify-between">
				<Card.Title class="text-sm">Next event</Card.Title>
				<Badge
					variant="secondary"
					class="border-emerald-200 bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400"
				>
					Published
				</Badge>
			</div>
		</Card.Header>
		<Card.Content class="space-y-3 pt-0">
			<div class="flex items-center gap-3">
				{#if startDate}
					<div
						class="flex shrink-0 flex-col items-center justify-center rounded-md bg-primary px-3 py-2 text-center"
					>
						<span class="text-xl leading-none font-medium text-primary-foreground"
							>{startDate.day}</span
						>
						<span class="mt-1 text-[10px] tracking-wider text-primary-foreground/70 uppercase"
							>{startDate.month}</span
						>
					</div>
				{/if}
				<p class="min-w-0 text-sm leading-snug font-medium">{event.title}</p>
			</div>

			<div class="space-y-1 text-xs text-muted-foreground">
				{#if location}
					<span class="flex items-center gap-1.5"><MapPinIcon class="size-3" />{location}</span>
				{/if}
				{#if eventTime}
					<span class="flex items-center gap-1.5"
						><ClockIcon class="size-3" />{eventTime.timeStr}</span
					>
				{/if}
				<span class="flex items-center gap-1.5">
					<UsersIcon class="size-3" />
					{signupCount}{event.maxSignups ? ` / ${event.maxSignups}` : ''} signed up
				</span>
			</div>

			{#if capacityPct !== null}
				<div class="h-1.5 w-full overflow-hidden rounded-full bg-muted">
					<div class="h-1.5 rounded-full bg-primary" style="width: {capacityPct}%"></div>
				</div>
			{/if}

			{#if hasWhatsApp}
				<div
					class="flex items-center gap-2 rounded-md bg-emerald-50 px-2.5 py-2 text-xs text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400"
				>
					<MessageCircleIcon class="size-3.5 shrink-0 text-emerald-600" />
					<span>WhatsApp flow active</span>
				</div>
			{/if}

			<div class="flex gap-2">
				<Button href="/events/{event.id}/signups" size="sm" class="h-7 flex-1 text-xs">
					View signups
				</Button>
				<Button variant="outline" size="sm" href="/events/{event.id}/preview" class="h-7 text-xs">
					<Share2Icon class="size-3.5" />
				</Button>
			</div>
		</Card.Content>
	</Card.Root>
{/if}
