<script lang="ts">
	import { env } from '$env/dynamic/public';
	import { cn } from '$lib/utils.js';
	let {
		latitude,
		longitude,
		class: className
	}: { latitude: number; longitude: number; class?: string } = $props();
</script>

<img
	class={cn('bg-background/60 rounded-md w-auto', className)}
	src="https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/pin-s+2b7fff({longitude},{latitude})/{longitude},{latitude},14,0/600x400.png?attribution=false&logo=false&access_token={env.PUBLIC_MAPBOX_TOKEN}"
	alt="Map of {latitude}, {longitude}"
/>
