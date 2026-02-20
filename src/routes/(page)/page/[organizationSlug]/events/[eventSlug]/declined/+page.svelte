<script lang="ts">
	const { data } = $props();
	import RenderEventPage from '$lib/components/layouts/public/event/RenderEventPage.svelte';
	import { page } from '$app/state';
	const paramTheme = page.url.searchParams.get('theme') || 'default';
	const themes = eventThemes;
	const theme = themes.includes(paramTheme as EventTheme) ? (paramTheme as EventTheme) : 'default';
</script>

<RenderEventPage
	event={data.event}
	organization={data.organization}
	layout="default"
	declined={true}
/>
