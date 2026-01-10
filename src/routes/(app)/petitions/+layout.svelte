<script lang="ts">
	import UniversalLayout from '$lib/components/layouts/app/UniversalLayout.svelte';
	import PetitionsSidebar from '$lib/components/layouts/app/sidebars/petitions/PetitionsSidebar.svelte';
	const { children } = $props();
</script>

{#snippet sidebar()}
	<PetitionsSidebar />
{/snippet}
<UniversalLayout rootNav="/petitions" {sidebar}>
	{@render children?.()}
</UniversalLayout>
