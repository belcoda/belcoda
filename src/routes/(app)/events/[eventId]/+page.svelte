<script lang="ts">
	import ContentLayout from '$lib/components/layouts/app/ContentLayout.svelte';
	const { params } = $props();
	import { z } from '$lib/zero.svelte';
	import queries from '$lib/zero/query/index';
	import { appState, getListFilter } from '$lib/state.svelte';
	import type { ListEventSignupsInput } from '$lib/zero/query/event_signup/list';
	const event = $derived.by(() => {
		return z.createQuery(queries.event.read({ eventId: params.eventId }));
	});
	const incompleteSignups = $derived.by(() => {
		const filter: ListEventSignupsInput = {
			...getListFilter(appState.organizationId),
			eventId: params.eventId,
			status: 'incomplete',
			includeDeleted: false,
			includeIncomplete: true
		};
		return z.createQuery(queries.eventSignup.list(filter));
	});
	import { Skeleton } from '$lib/components/ui/skeleton/index.js';
	import Avatar from '$lib/components/widgets/avatar/Avatar.svelte';
	import RenderEventDetails from '$lib/components/layouts/app/sidebars/events/RenderEventDetails.svelte';
	import EventSignups from '$lib/components/widgets/event/EventSignups.svelte';
	import EventActionButton from './EventActionButton.svelte';
	import * as Alert from '$lib/components/ui/alert/index.js';
	import CircleAlertIcon from '@lucide/svelte/icons/circle-alert';
	import { t } from '$lib/index.svelte';
</script>

<ContentLayout rootLink="/events" {header}>
	{#if event.details.type === 'complete' && event.data}
		{#if incompleteSignups.data.length > 0}
			<Alert.Root class="mb-4">
				<CircleAlertIcon class="text-yellow-600" />
				<Alert.Title>{t`Incomplete signups require follow-up`}</Alert.Title>
				<Alert.Description>
					{t`There are ${incompleteSignups.data.length.toString()} incomplete signup(s).`}
					<a class="ml-1 underline" href={`/events/${event.data.id}/signups`}
						>{t`View the detailed signups table`}</a
					>
				</Alert.Description>
			</Alert.Root>
		{/if}
		<EventSignups event={event.data} />
	{:else}
		<!-- TODO: Add a loading state -->
		<Skeleton class="h-48 w-full" />
		<Skeleton class="h-48 w-full" />
		<Skeleton class="h-48 w-full" />
	{/if}
</ContentLayout>

{#snippet header()}
	<div class="flex items-center justify-between">
		<div>
			{#if event.data && event.data.title}
				<div class="flex w-full items-center justify-start gap-3">
					<div class="w-12">
						<Avatar
							src={event.data.featureImage}
							name1={event.data.title}
							class="size-12 rounded-lg"
							imageClass="rounded-lg object-cover"
						/>
					</div>
					<div>
						<div class="text-lg font-medium">{event.data.title}</div>
						<RenderEventDetails event={event.data} />
					</div>
				</div>
			{:else}
				<Skeleton class="h-10 w-20 rounded-lg" />
			{/if}
		</div>
		<div>
			{#if event.data}
				<EventActionButton event={event.data} />
			{:else}
				<Skeleton class="h-10 w-16 rounded-lg" />
			{/if}
		</div>
	</div>
{/snippet}
