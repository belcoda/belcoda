<script lang="ts">
	import UniversalLayout from '$lib/components/layouts/app/UniversalLayout.svelte';
	import CommunitySidebar from '$lib/components/layouts/app/sidebars/community/CommunitySidebar.svelte';
	const { children } = $props();
	import { appState } from '$lib/state.svelte';
</script>

{#snippet sidebar()}
	{#key appState.organizationId}
		<CommunitySidebar />
	{/key}
{/snippet}
<UniversalLayout rootNav="/community" {sidebar}>
	{@render children?.()}
</UniversalLayout>
