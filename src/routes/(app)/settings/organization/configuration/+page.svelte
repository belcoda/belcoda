<script lang="ts">
	import { t } from '$lib/index.svelte';
	import ContentLayout from '$lib/components/layouts/app/ContentLayout.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { appState } from '$lib/state.svelte';
	import OrgConfigForm from './OrgConfigForm.svelte';
	import { type ReadOrganizationZero } from '$lib/schema/organization';
</script>

<ContentLayout rootLink="/settings">
	{#snippet header()}
		<div class="flex items-center justify-between">
			<h1 class="text-2xl font-bold">{t`Configuration`}</h1>
		</div>
	{/snippet}
	{#if appState.activeOrganization.data}
		<OrgConfigForm organization={appState.activeOrganization.data as ReadOrganizationZero} />
	{/if}
	{#snippet footer()}
		<div class="flex w-full items-center justify-end gap-2">
			<Button
				variant="outline"
				onclick={() => {
					if (window.confirm(t`Are you sure you want to cancel?`)) {
						window.history.back();
					}
				}}>{t`Cancel`}</Button
			>
			<Button form="org-config-form" type="submit">{t`Save`}</Button>
		</div>
	{/snippet}
</ContentLayout>
