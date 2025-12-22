<script lang="ts">
	import UniversalLayout from '$lib/components/layouts/app/UniversalLayout.svelte';
	import CommunitySidebar from '$lib/components/layouts/app/sidebars/community/CommunitySidebar.svelte';
	const { children } = $props();
</script>

{#snippet sidebar()}
	<CommunitySidebar />
{/snippet}
<UniversalLayout rootNav="/community" {sidebar}>
	{@render children?.()}
</UniversalLayout>
