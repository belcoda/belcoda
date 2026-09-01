<script lang="ts">
	import { t } from '$lib/index.svelte';
	import MapPinIcon from '@lucide/svelte/icons/map-pin';
	import MapPinnedIcon from '@lucide/svelte/icons/map-pinned';
	import XIcon from '@lucide/svelte/icons/x';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { cn } from '$lib/utils.js';
	import { type CountryCode } from '$lib/utils/country';
	import Map from './Map.svelte';
	import StaticMap from './StaticMap.svelte';

	let {
		country,
		latitude = $bindable(),
		longitude = $bindable(),
		class: className
	}: {
		country: CountryCode;
		latitude?: number;
		longitude?: number;
		class?: string;
	} = $props();

	let open = $state(false);
	// Working copy edited inside the dialog, so cancelling discards changes and
	// the committed value only updates on save.
	let draftLatitude = $state<number | undefined>(undefined);
	let draftLongitude = $state<number | undefined>(undefined);

	const hasLocation = $derived(latitude != null && longitude != null);
	const hasDraft = $derived(draftLatitude != null && draftLongitude != null);

	function formatCoords(lat: number, lng: number) {
		return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
	}

	function openDialog() {
		draftLatitude = latitude;
		draftLongitude = longitude;
		open = true;
	}

	function save() {
		latitude = draftLatitude;
		longitude = draftLongitude;
		open = false;
	}

	function clearLocation() {
		latitude = undefined;
		longitude = undefined;
	}
</script>

<div class={cn('flex flex-col gap-3', className)}>
	{#if hasLocation && latitude != null && longitude != null}
		<!-- Committed location: preview + change / remove controls -->
		<div class="bg-muted/30 overflow-hidden rounded-xl border">
			<div class="relative">
				<StaticMap {latitude} {longitude} class="h-40 w-full rounded-none object-cover" />
				<Button
					type="button"
					variant="secondary"
					size="icon"
					onclick={clearLocation}
					class="absolute end-2 top-2 size-8 shadow-sm"
				>
					<XIcon class="size-4" />
					<span class="sr-only">{t`Remove location`}</span>
				</Button>
			</div>
			<div class="flex items-center justify-between gap-3 px-3 py-2.5">
				<div class="text-muted-foreground flex min-w-0 items-center gap-2 text-sm">
					<MapPinIcon class="size-4 shrink-0" />
					<span class="truncate tabular-nums">{formatCoords(latitude, longitude)}</span>
				</div>
				<Button type="button" variant="outline" size="sm" onclick={openDialog}>
					{t`Change`}
				</Button>
			</div>
		</div>
	{:else}
		<!-- No location yet: trigger button -->
		<Button type="button" variant="outline" onclick={openDialog} class="w-fit">
			<MapPinnedIcon class="size-4" />
			{t`Select location`}
		</Button>
	{/if}
</div>

<Dialog.Root bind:open>
	<Dialog.Content class="gap-0 overflow-hidden p-0 sm:max-w-2xl">
		<Dialog.Header class="p-6 pb-4">
			<Dialog.Title>{t`Select location`}</Dialog.Title>
			<Dialog.Description>
				{t`Click the map to drop a pin, then drag it to fine-tune the exact spot.`}
			</Dialog.Description>
		</Dialog.Header>

		<div class="bg-muted h-[min(60vh,420px)] w-full border-y">
			{#if open}
				<Map
					{country}
					bind:latitude={draftLatitude}
					bind:longitude={draftLongitude}
					class="h-full w-full"
				/>
			{/if}
		</div>

		<Dialog.Footer class="flex-row items-center justify-between gap-3 p-6 pt-4 sm:justify-between">
			<div class="text-muted-foreground flex min-w-0 items-center gap-2 text-sm">
				{#if hasDraft && draftLatitude != null && draftLongitude != null}
					<MapPinIcon class="size-4 shrink-0" />
					<span class="truncate tabular-nums">
						{formatCoords(draftLatitude, draftLongitude)}
					</span>
				{:else}
					<span class="truncate">{t`No location selected yet`}</span>
				{/if}
			</div>
			<div class="flex shrink-0 gap-2">
				<Button type="button" variant="ghost" onclick={() => (open = false)}>
					{t`Cancel`}
				</Button>
				<Button type="button" onclick={save} disabled={!hasDraft}>
					{t`Save location`}
				</Button>
			</div>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
