<script lang="ts">
	const { data } = $props();
	import { page } from '$app/state';
	import { eventThemes, type EventTheme } from '$lib/schema/event';
	const paramTheme = page.url.searchParams.get('theme') || 'default';
	const themes = eventThemes;
	const theme = themes.includes(paramTheme as EventTheme) ? (paramTheme as EventTheme) : 'default';

	import RenderEventPage from '$lib/components/layouts/public/event/RenderEventPage.svelte';
</script>

<RenderEventPage event={data.event} organization={data.organization} layout={theme} success={true} />
