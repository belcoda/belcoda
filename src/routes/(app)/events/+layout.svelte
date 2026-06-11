<script lang="ts">
	import UniversalLayout from '$lib/components/layouts/app/UniversalLayout.svelte';
	import EventsSidebar from '$lib/components/layouts/app/sidebars/events/EventsSidebar.svelte';
	import { initEventsListPaginationContext } from '$lib/components/layouts/app/sidebars/events/events-list-pagination';

	const { children } = $props();

	initEventsListPaginationContext();
</script>

{#snippet sidebar()}
	<EventsSidebar />
{/snippet}
<UniversalLayout rootNav="/events" {sidebar}>
	{@render children?.()}
</UniversalLayout>
