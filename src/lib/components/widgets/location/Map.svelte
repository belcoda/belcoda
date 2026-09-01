<script lang="ts">
	import * as mapboxgl from 'mapbox-gl/esm';
	import 'mapbox-gl/dist/mapbox-gl.css';
	import { onMount, onDestroy } from 'svelte';
	import { env } from '$env/dynamic/public';
	import { getLocation } from './getLocation';
	import { getCountryBounds } from './getCountryBounds';
	import { cn } from '$lib/utils.js';
	import { Spinner } from '$lib/components/ui/spinner';
	let map: mapboxgl.Map | null = $state(null);
	let marker: mapboxgl.Marker | null = null;
	let mapContainer: HTMLElement;
	let resizeObserver: ResizeObserver | null = null;
	// True while we resolve the location and the map's first render is still pending.
	let loading = $state(true);
	// True once onDestroy has run, so an in-flight onMount can bail out.
	let destroyed = false;

	import { type CountryCode } from '$lib/utils/country';
	let {
		country,
		latitude = $bindable(),
		longitude = $bindable(),
		class: className
	}: { country: CountryCode; latitude?: number; longitude?: number; class?: string } = $props();

	onMount(async () => {
		const accessToken = env.PUBLIC_MAPBOX_TOKEN;
		// Prefer a coordinate passed in via props; only fall back to device
		// geolocation when we don't already have one.
		const hasInitialCoords = latitude != null && longitude != null;
		const location = hasInitialCoords ? null : await getLocation();
		// Guard: the component may have been destroyed while awaiting geolocation.
		if (destroyed) return;
		if (location?.coords.latitude) {
			latitude = location.coords.latitude;
		}
		if (location?.coords.longitude) {
			longitude = location.coords.longitude;
		}
		const hasCoords = latitude != null && longitude != null;
		map = new mapboxgl.Map({
			accessToken,
			logoPosition: 'bottom-left',
			container: mapContainer,
			center: [longitude ?? 0, latitude ?? 0], // starting position [lng, lat]. Note that lat must be set between -90 and 90
			zoom: hasCoords ? 13 : 2 // zoom into the coordinate, or start wide before framing the country
		});

		// Register these synchronously, before any further awaits below, so we
		// never miss the load event or block click-to-place while geocoding.
		// Let the user (re)place the marker by clicking anywhere on the map.
		map.on('click', (event) => {
			placeMarker(event.lngLat.lng, event.lngLat.lat);
		});

		// Hide the spinner once the map has rendered its first frame.
		map.on('load', () => {
			loading = false;
		});

		// Keep the map sized to its container across dialog animations/resizes.
		if (typeof ResizeObserver !== 'undefined') {
			resizeObserver = new ResizeObserver(() => {
				map?.resize();
			});
			resizeObserver.observe(mapContainer);
		}

		// Show a draggable marker if we already have a coordinate (geolocation or props).
		if (latitude != null && longitude != null) {
			placeMarker(longitude, latitude);
		} else {
			// No coordinate yet — hint that clicking drops the marker, and frame the
			// required country so the user has somewhere sensible to click.
			map.getCanvas().style.cursor = 'crosshair';
			const bounds = await getCountryBounds(country, accessToken);
			// Guard: the component may have been destroyed while awaiting the geocode.
			if (destroyed) return;
			if (bounds && map) {
				map.fitBounds(bounds, { padding: 40, animate: false });
			}
		}
	});

	// Create the marker on first use, otherwise move it. Either way, sync the
	// bound latitude/longitude so the parent gets the selected coordinate.
	function placeMarker(lng: number, lat: number) {
		if (!map) return;
		if (marker) {
			marker.setLngLat([lng, lat]);
		} else {
			marker = new mapboxgl.Marker({ draggable: true, color: '#2b7fff' })
				.setLngLat([lng, lat])
				.addTo(map);
			marker.on('dragend', () => {
				const lngLat = marker?.getLngLat();
				if (lngLat) {
					longitude = lngLat.lng;
					latitude = lngLat.lat;
				}
			});
			// Marker now exists — no longer prompting a first click.
			map.getCanvas().style.cursor = '';
		}
		longitude = lng;
		latitude = lat;
	}

	onDestroy(() => {
		destroyed = true;
		resizeObserver?.disconnect();
		map?.remove();
	});
</script>

<div class={cn('relative', className)}>
	<div id="map-container" bind:this={mapContainer}></div>
	{#if loading}
		<div
			class="bg-background/60 absolute inset-0 z-10 flex items-center justify-center backdrop-blur-sm"
		>
			<Spinner class="text-muted-foreground size-8" />
		</div>
	{/if}
</div>

<style>
	#map-container {
		width: 100%;
		height: 100%;
		min-height: 100px;
	}
</style>
