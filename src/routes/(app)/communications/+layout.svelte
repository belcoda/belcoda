<script lang="ts">
	import UniversalLayout from '$lib/components/layouts/app/UniversalLayout.svelte';
	import CommunicationsSidebar from '$lib/components/layouts/app/sidebars/communications/CommunicationsSidebar.svelte';
	const { children } = $props();
</script>

{#snippet sidebar()}
	<CommunicationsSidebar />
{/snippet}
<UniversalLayout rootNav="/communications" {sidebar}>
	{@render children?.()}
</UniversalLayout>
