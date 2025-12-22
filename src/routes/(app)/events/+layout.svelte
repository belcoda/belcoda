<script lang="ts">
	import UniversalLayout from '$lib/components/layouts/app/UniversalLayout.svelte';
	import EventsSidebar from '$lib/components/layouts/app/sidebars/events/EventsSidebar.svelte';
	const { children } = $props();
</script>

{#snippet sidebar()}
	<EventsSidebar />
{/snippet}
<UniversalLayout rootNav="/events" {sidebar}>
	{@render children?.()}
</UniversalLayout>
