<script lang="ts">
	import UniversalLayout from '$lib/components/layouts/app/UniversalLayout.svelte';
	import SettingsSidebar from '$lib/components/layouts/app/sidebars/settings/SettingsSidebar.svelte';
	const { children } = $props();
	import { appState } from '$lib/state.svelte';
	import { t } from '$lib/index.svelte';
	import * as Empty from '$lib/components/ui/empty/index.js';
	import CogIcon from '@lucide/svelte/icons/cog';
	import { Button } from '$lib/components/ui/button/index.js';
</script>

{#if appState.isAdminOrOwner}
	{#snippet sidebar()}
		<SettingsSidebar />
	{/snippet}
	<UniversalLayout rootNav="/settings" {sidebar}>
		{@render children?.()}
	</UniversalLayout>
{:else}
	<div class="flex h-screen w-full items-center justify-center">
		<Empty.Root>
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
