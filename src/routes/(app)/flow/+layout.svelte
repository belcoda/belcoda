<script lang="ts">
	import UniversalLayout from '$lib/components/layouts/app/UniversalLayout.svelte';
	import FlowSidebar from '$lib/components/layouts/app/sidebars/flow/FlowSidebar.svelte';
	const { children } = $props();
	import { appState } from '$lib/state.svelte';
</script>

{#snippet sidebar()}
	{#key appState.organizationId}
		<FlowSidebar />
	{/key}
{/snippet}
<UniversalLayout rootNav="/flow" {sidebar}>
	{@render children?.()}
</UniversalLayout>
