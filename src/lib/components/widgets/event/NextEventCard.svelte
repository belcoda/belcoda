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

	const description = $derived.by(() => {
		if (!event?.description) return null;
		return typeof event.description === 'string' ? event.description : null;
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
		<Card.Content class="flex flex-col items-center gap-2 py-8 text-center">
			<p class="text-sm font-medium">No upcoming events</p>
			<p class="text-xs text-muted-foreground">Published events will appear here.</p>
			<Button href="/events/new" size="sm" class="mt-2">Create an event</Button>
		</Card.Content>
	</Card.Root>
{:else}
	<Card.Root class="overflow-hidden rounded-lg">
		<div class="flex">
			{#if event.featureImage}
				<div class="relative w-36 shrink-0">
					<img
						src={event.featureImage}
						alt={event.title}
						class="h-full min-h-44 w-full object-cover"
					/>
					{#if startDate}
						<div
							class="absolute bottom-3 left-3 rounded-md bg-black/55 px-2.5 py-2 text-center backdrop-blur-sm"
						>
							<span class="text-xl leading-none font-semibold text-white">{startDate.day}</span>
							<span class="mt-1 block text-[9px] tracking-widest text-white/75 uppercase"
								>{startDate.month}</span
							>
						</div>
					{/if}
				</div>
			{:else if startDate}
				<div class="flex shrink-0 flex-col items-center justify-center bg-primary px-5 text-center">
					<span class="text-3xl leading-none font-semibold text-primary-foreground"
						>{startDate.day}</span
					>
					<span
						class="mt-1.5 text-xs font-medium tracking-widest text-primary-foreground/70 uppercase"
						>{startDate.month}</span
					>
				</div>
			{/if}

			<!-- Right: content -->
			<div class="min-w-0 flex-1 p-5">
				<div class="flex items-center gap-2">
					<Badge
						variant="secondary"
						class="border-emerald-200 bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400"
					>
						Published
					</Badge>
					<span class="text-xs text-muted-foreground">Next event</span>
				</div>

				<h2 class="mt-2 text-lg leading-tight font-semibold">{event.title}</h2>

				{#if description}
					<p class="mt-1.5 line-clamp-2 text-sm text-muted-foreground">{description}</p>
				{/if}

				<div class="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
					{#if location}
						<span class="flex items-center gap-1.5">
							<MapPinIcon class="size-3.5 shrink-0" />{location}
						</span>
					{/if}
					{#if eventTime}
						<span class="flex items-center gap-1.5">
							<ClockIcon class="size-3.5 shrink-0" />{eventTime.timeStr}
						</span>
					{/if}
					<span class="flex items-center gap-1.5">
						<UsersIcon class="size-3.5 shrink-0" />
						{signupCount}{event.maxSignups ? ` / ${event.maxSignups}` : ''} signed up
					</span>
				</div>

				{#if capacityPct !== null}
					<div class="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
						<div class="h-1.5 rounded-full bg-primary" style="width: {capacityPct}%"></div>
					</div>
				{/if}

				<div class="mt-4 flex flex-wrap gap-2">
					<Button href="/events/{event.id}/signups" size="sm">View signups</Button>
					{#if hasWhatsApp}
						<Button variant="outline" size="sm" href="/events/{event.id}/reminders">
							<MessageCircleIcon class="size-4" />
							Send reminder
						</Button>
					{/if}
					<Button variant="outline" size="sm" href="/events/{event.id}/preview">
						<Share2Icon class="size-4" />
						Share
					</Button>
				</div>
			</div>
		</div>
	</Card.Root>
{/if}
