<script lang="ts">
	import UniversalLayout from '$lib/components/layouts/app/UniversalLayout.svelte';
	import SettingsSidebar from '$lib/components/layouts/app/sidebars/settings/SettingsSidebar.svelte';
	import {
		settingsItems,
		type SettingsScope
	} from '$lib/components/layouts/app/sidebars/settings/items';
	import { page } from '$app/state';
	import { setContext } from 'svelte';
	const { children } = $props();

	const scope = $derived.by<SettingsScope>(() => {
		const pathname = page.url.pathname;
		const match = settingsItems.find(
			(item) => pathname === item.url || pathname.startsWith(item.url + '/')
		);
		return match?.scope ?? 'workspace';
	});

	setContext('settings-scope', () => scope);
</script>

{#snippet sidebar()}
	<SettingsSidebar />
{/snippet}
<UniversalLayout rootNav="/settings" {sidebar}>
	{@render children?.()}
</UniversalLayout>
