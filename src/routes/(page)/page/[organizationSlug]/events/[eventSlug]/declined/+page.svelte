<script lang="ts">
	const { data } = $props();
	import RenderEventPage from '$lib/components/layouts/public/event/RenderEventPage.svelte';
	import { eventThemes, type EventTheme } from '$lib/schema/event';
	import { page } from '$app/state';
	const paramLayout = page.url.searchParams.get('layout') || 'default';
	const layouts = eventThemes;
	const layout = layouts.includes(paramLayout as EventTheme)
		? (paramLayout as EventTheme)
		: 'default';
</script>

<RenderEventPage event={data.event} organization={data.organization} {layout} declined={true} />
