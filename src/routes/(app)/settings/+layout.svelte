<script lang="ts">
	import UniversalLayout from '$lib/components/layouts/app/UniversalLayout.svelte';
	import SettingsSidebar from '$lib/components/layouts/app/sidebars/settings/SettingsSidebar.svelte';
	import { settingsItems } from '$lib/components/layouts/app/sidebars/settings/items';
	import { appState } from '$lib/state.svelte';
	import { t } from '$lib/index.svelte';
	import * as Empty from '$lib/components/ui/empty/index.js';
	import CogIcon from '@lucide/svelte/icons/cog';
	import { Button } from '$lib/components/ui/button/index.js';
	import { page } from '$app/state';
	const { children } = $props();

	const currentItem = $derived.by(() => {
		const pathname = page.url.pathname;
		return settingsItems.find(
			(item) => pathname === item.url || pathname.startsWith(item.url + '/')
		);
	});

	const canAccess = $derived(
		!currentItem ||
			currentItem.permissions === 'member' ||
			appState.isOwner ||
			(appState.isAdmin && currentItem.permissions === 'admin')
	);
</script>

{#if canAccess}
	{#snippet sidebar()}
		<SettingsSidebar />
	{/snippet}
	<UniversalLayout rootNav="/settings" {sidebar}>
		{@render children?.()}
	</UniversalLayout>
{:else}
	<div class="flex h-screen w-full items-center justify-center">
		<Empty.Root data-testid="settings-unauthorized">
			<Empty.Header>
				<Empty.Media variant="icon">
					<CogIcon />
				</Empty.Media>
				<Empty.Title>{t`You are not authorized to access this page.`}</Empty.Title>
				<Empty.Description
					>{t`You need to be an organization admin or owner to access this page.`}</Empty.Description
				>
			</Empty.Header>
			<Empty.Content>
				<Button variant="default" size="sm" href="/">
					{t`Go to dashboard`}
				</Button>
			</Empty.Content>
		</Empty.Root>
	</div>
{/if}
