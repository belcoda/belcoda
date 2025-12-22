<script lang="ts">
	import UniversalLayout from '$lib/components/layouts/app/UniversalLayout.svelte';
	import PreferencesSidebar from '$lib/components/layouts/app/sidebars/preferences/PreferencesSidebar.svelte';
	const { children } = $props();
</script>

{#snippet sidebar()}
	<PreferencesSidebar />
{/snippet}
<UniversalLayout rootNav="/preferences" {sidebar}>
	{@render children?.()}
</UniversalLayout>
