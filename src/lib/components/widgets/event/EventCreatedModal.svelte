<script lang="ts">
	import { t } from '$lib/index.svelte';
	import type { ReadEventZero } from '$lib/schema/event';
	import type { ReadOrganizationZero } from '$lib/schema/organization';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Switch } from '$lib/components/ui/switch/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import * as Drawer from '$lib/components/ui/drawer/index.js';
	import { MediaQuery } from 'svelte/reactivity';
	import { z } from '$lib/zero.svelte';
	import { mutators } from '$lib/zero/mutate/client_mutators';
	import { appState } from '$lib/state.svelte';
	import { toast } from 'svelte-sonner';
	import { goto } from '$app/navigation';
	import ExternalLinkIcon from '@lucide/svelte/icons/external-link';
	import CalendarDaysIcon from '@lucide/svelte/icons/calendar-days';
	import ClockIcon from '@lucide/svelte/icons/clock';
	import MapPinIcon from '@lucide/svelte/icons/map-pin';
	import CircleAlertIcon from '@lucide/svelte/icons/circle-alert';
	import { renderEventTime } from '$lib/utils/date';
	import { renderAddress } from '$lib/utils/string/address';
	import { locale } from '$lib/index.svelte';
	import { getLocalTimeZone } from '@internationalized/date';

	let {
		event,
		organization,
		open = $bindable(false),
		onOpenChange
	}: {
		event: ReadEventZero;
		organization: ReadOrganizationZero;
		open?: boolean;
		onOpenChange?: (open: boolean) => void;
	} = $props();

	const isDesktop = new MediaQuery('(min-width: 768px)');

	async function updatePublished(checked: boolean) {
		await z.mutate(
			mutators.event.update({
				metadata: {
					eventId: event.id,
					teamId: appState.activeTeamId,
					organizationId: appState.organizationId
				},
				input: {
					published: checked
				}
			})
		);
	}

	async function handlePublishChange(checked: boolean) {
		try {
			await updatePublished(checked);
			if (checked) {
				toast.success('Event published');
			} else {
				toast.success('Event unpublished');
			}
		} catch (error) {
			toast.error('Failed to update event');
			console.error('Error updating event published status:', error);
		}
	}

	function handleViewFullPage() {
		goto(`/events/${event.id}/preview`);
	}

	function handleClose() {
		onOpenChange?.(false);
	}

	const eventTimeData = $derived.by(() => {
		const startsAt = event.startsAt ? new Date(event.startsAt).getTime() : Date.now();
		const endsAt = event.endsAt ? new Date(event.endsAt).getTime() : startsAt + 3600000;
		return renderEventTime(startsAt, endsAt, locale.current, event.timezone || getLocalTimeZone());
	});
</script>

{#if isDesktop.current}
	<Dialog.Root bind:open {onOpenChange}>
		<Dialog.Content class="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
			<Dialog.Header class="relative">
				<Dialog.Title>{t`Event Created!`}</Dialog.Title>
				<Dialog.Description>
					{t`Here's a preview of how your event will appear to your audience.`}
				</Dialog.Description>
			</Dialog.Header>

			{@render eventPreview()}

			<Dialog.Footer class="flex-col gap-2 pt-4 sm:flex-row">
				{@render actionButtons()}
			</Dialog.Footer>
		</Dialog.Content>
	</Dialog.Root>
{:else}
	<Drawer.Root bind:open {onOpenChange}>
		<Drawer.Content class="max-h-[90vh]">
			<Drawer.Header class="relative text-start">
				<Drawer.Title>{t`Event Created!`}</Drawer.Title>
				<Drawer.Description>
					{t`Here's a preview of how your event will appear to your audience.`}
				</Drawer.Description>
			</Drawer.Header>

			<div class="overflow-y-auto px-4">
				{@render eventPreview()}
			</div>

			<Drawer.Footer class="flex-col gap-2 pt-4">
				{@render actionButtons()}
			</Drawer.Footer>
		</Drawer.Content>
	</Drawer.Root>
{/if}

{#snippet eventPreview()}
	<div class="space-y-4">
		{#if !event.published}
			<div class="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
				<div class="flex items-start gap-3">
					<div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-yellow-100">
						<CircleAlertIcon class="size-5 text-yellow-600" />
					</div>
					<div class="flex-1">
						<h4 class="font-medium text-yellow-900">{t`Event not published`}</h4>
						<p class="text-sm text-yellow-700">
							{t`This event is not published yet. Toggle the switch below to make it visible to your audience.`}
						</p>
					</div>
				</div>
			</div>
		{/if}

		<div class="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
			{#if event.featureImage}
				<div class="relative h-48 w-full">
					<img
						src={event.featureImage}
						alt={event.title}
						class="h-full w-full object-cover"
					/>
				</div>
			{/if}

			<div class="p-6">
				<h2 class="mb-4 text-xl font-bold tracking-tight text-gray-900">
					{event.title}
				</h2>

				<div class="space-y-3">
					<div class="flex items-center space-x-3">
						<div
							class="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100"
						>
							<CalendarDaysIcon class="size-5 text-gray-600" />
						</div>
						<div>
							<div class="text-sm font-medium text-gray-900">{eventTimeData.dateStr}</div>
						</div>
					</div>

					<div class="flex items-center space-x-3">
						<div
							class="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100"
						>
							<ClockIcon class="size-5 text-gray-600" />
						</div>
						<div>
							<div class="text-sm font-medium text-gray-900">
								{eventTimeData.timeStr}
								{#if event.settings?.displayTimezone}
									<span class="text-sm text-gray-500">({event.timezone})</span>
								{/if}
							</div>
						</div>
					</div>

					{#if event.addressLine1}
						<div class="flex items-center space-x-3">
							<div
								class="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100"
							>
								<MapPinIcon class="size-5 text-gray-600" />
							</div>
							<div>
								<div class="text-sm font-medium text-gray-900">
									{renderAddress({
										addressLine1: event.addressLine1,
										addressLine2: event.addressLine2,
										locality: event.locality,
										region: event.region,
										postcode: event.postcode,
										country: event.country,
										locale: locale.current
									})}
								</div>
							</div>
						</div>
					{/if}
				</div>

				{#if event.shortDescription}
					<div class="mt-4 border-t border-gray-100 pt-4">
						<p class="text-gray-700">{event.shortDescription}</p>
					</div>
				{/if}
			</div>
		</div>
	</div>
{/snippet}

{#snippet actionButtons()}
	<div class="flex w-full flex-col gap-2 sm:flex-row sm:justify-between">
		<div class="flex items-center gap-3 px-4 py-2">
			<Switch
				id="publish-toggle"
				checked={event.published}
				onCheckedChange={handlePublishChange}
			/>
			<Label for="publish-toggle" class="cursor-pointer">
				{event.published ? t`Published` : t`Publish event`}
			</Label>
		</div>

		<div class="flex gap-2">
			<Button variant="outline" onclick={handleViewFullPage}>
				<ExternalLinkIcon class="mr-2 size-4" />
				{t`View full page`}
			</Button>
		</div>
	</div>
{/snippet}
