<script lang="ts">
	import UniversalLayout from '$lib/components/layouts/app/UniversalLayout.svelte';
	import SettingsSidebar from '$lib/components/layouts/app/sidebars/settings/SettingsSidebar.svelte';
	const { children } = $props();
</script>

{#snippet sidebar()}
	<SettingsSidebar />
{/snippet}
<UniversalLayout rootNav="/settings" {sidebar}>
	{@render children?.()}
</UniversalLayout>
